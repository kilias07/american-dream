/**
 * Import the REAL programme (July 2026 → future) from the old site into the
 * `events` collection. Source: WordPress "Modern Events Calendar" REST API
 * (https://americandreamclub.pl/wp-json/mec/v1/events).
 *
 * - Idempotent: upserts by `slug` (taken from the old event URL — SEO parity).
 * - First DELETES future events (date >= 1 July 2026, Europe/Warsaw) whose slug
 *   is not in the imported set — those are the fictional seed/demo events that
 *   occupy the same days and would trip the one-event-per-day validator.
 * - Event photos are downloaded from the old site and uploaded via `filePath`
 *   (remote R2 rejects buffer uploads). Events without a photo get their OWN
 *   copy of the shared placeholder (one media doc per event, so replacing one
 *   photo in the CMS never bleeds into another event).
 * - Performers are matched by surname against EXISTING musicians only —
 *   unmatched names stay in the body text, no new musicians are created.
 * - "Klub X Muzy" events are linked to the existing `klub-x-muzy` series.
 * - PL locale only; localization `fallback: true` serves PL content under /en.
 *
 * Local:       pnpm exec tsx scripts/import-mec-events.ts
 * Remote prod: NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true pnpm exec tsx scripts/import-mec-events.ts
 */
import 'dotenv/config'
import os from 'os'
import path from 'path'
import * as fsp from 'fs/promises'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const LOCALE = 'pl' as const
const ROOT = process.cwd()
const MEC_URL =
  'https://americandreamclub.pl/wp-json/mec/v1/events' +
  '?startParam=2026-07-01&endParam=2028-01-01&show_past_events=1&show_only_past_events=0&show_only_one_occurrence=0'
// 1 July 2026 00:00 Europe/Warsaw (CEST, UTC+2)
const FROM_ISO = '2026-06-30T22:00:00.000Z'
// Where downloaded photos are cached between runs (local + remote import runs
// on the same machine share this, and it doubles as the source for a manual
// `wrangler r2 object put` if the remote upload 404s).
const IMG_CACHE = path.join(os.tmpdir(), 'adc-mec-images')

type MecEvent = {
  id: number
  title: string
  start: string
  end: string
  end_time: string
  image: string
  url: string
  description: string
}

// ── HTML → plain/lexical helpers ───────────────────────────────────────────
const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  oacute: 'ó', Oacute: 'Ó', hellip: '…', ndash: '–', mdash: '—',
}
function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (_, name: string) => ENTITIES[name] ?? `&${name};`)
}

type TextNode = { type: 'text'; detail: 0; format: number; mode: 'normal'; style: ''; text: string; version: 1 }
const text = (t: string, format = 0): TextNode => ({
  type: 'text', detail: 0, format, mode: 'normal', style: '', text: t, version: 1,
})

// Parse one line of inline HTML into lexical text nodes (bold=1, italic=2).
function inlineNodes(html: string): TextNode[] {
  const nodes: TextNode[] = []
  let bold = 0
  let italic = 0
  // Split on the formatting tags we honour; every other tag is stripped.
  const parts = html.split(/(<\/?(?:i|em|b|strong)\b[^>]*>)/i)
  for (const part of parts) {
    const m = part.match(/^<(\/?)(i|em|b|strong)\b/i)
    if (m) {
      const closing = m[1] === '/'
      const tag = m[2].toLowerCase()
      if (tag === 'i' || tag === 'em') italic = closing ? 0 : 2
      else bold = closing ? 0 : 1
      continue
    }
    const plain = decodeEntities(part.replace(/<[^>]+>/g, ''))
    if (!plain.trim()) continue
    nodes.push(text(plain.replace(/\s+/g, ' '), bold | italic))
  }
  return nodes
}

function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

// Full description HTML → { body (lexical), lines (plain, per <br>), priceZl }
function parseDescription(html: string) {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<button[\s\S]*?<\/button>/gi, '')
  const paragraphs = [...cleaned.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => m[1])
  const allLines: string[] = []
  const children: unknown[] = []
  for (const p of paragraphs) {
    const lines = p
      .split(/<br\s*\/?>/i)
      .map((l) => ({ nodes: inlineNodes(l), plain: plainText(l) }))
      .filter((l) => l.plain.length > 0)
    if (!lines.length) continue
    allLines.push(...lines.map((l) => l.plain))
    const paraChildren: unknown[] = []
    lines.forEach((l, i) => {
      if (i > 0) paraChildren.push({ type: 'linebreak', version: 1 })
      paraChildren.push(...l.nodes)
    })
    children.push({
      type: 'paragraph', format: '', indent: 0, version: 1,
      direction: 'ltr' as const, textFormat: 0, children: paraChildren,
    })
  }
  const body = children.length
    ? { root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr' as const, children } }
    : null
  const priceMatch = allLines.join(' ').match(/bilety?\s*:?\s*(\d+)\s*zł/i)
  return { body, lines: allLines, priceZl: priceMatch ? Number(priceMatch[1]) : null }
}

// Short card/popover description: first line of the intro, cut at a sentence
// boundary when it runs long.
function shortDescription(lines: string[]): string {
  const first = lines[0] ?? ''
  if (first.length <= 300) return first
  const cut = first.slice(0, 300)
  const lastStop = cut.lastIndexOf('. ')
  return lastStop > 80 ? cut.slice(0, lastStop + 1) : cut
}

const INSTRUMENTS =
  'wokal|śpiew|fortepian|piano|kontrabas|saksofon|gitara|perkusja|trąbka|klarnet|skrzypce|bas|flet|akordeon|organy|wibrafon|harmonijka'
// Matches every "Firstname Lastname – instrument[, instrument…]" pair in a line
// (descriptions list several performers per line, often after a "Na scenie:"
// prefix and sometimes with a trailing "na żywo").
const PERFORMER_RE = new RegExp(
  `([A-ZŻŹĆŁŚÓĄĘŃ][\\p{L}'.]+(?:\\s+[A-ZŻŹĆŁŚÓĄĘŃ][\\p{L}'.]+)+)\\s*[–—-]\\s*((?:${INSTRUMENTS})(?:\\s*,\\s*(?:${INSTRUMENTS}))*)`,
  'giu',
)

function slugFromUrl(url: string): string | null {
  const m = url.match(/\/events\/([^/?#]+)/)
  return m ? m[1] : null
}

async function run() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  log(`Fetching old-site programme… ${MEC_URL}`)
  const res = await fetch(MEC_URL)
  if (!res.ok) throw new Error(`MEC API ${res.status}`)
  const mecEvents = (await res.json()) as MecEvent[]
  log(`Old site returned ${mecEvents.length} events (July 2026 → future).`)
  if (!mecEvents.length) throw new Error('MEC API returned no events — aborting (nothing to import).')

  // ── existing CMS lookups ──────────────────────────────────────────────────
  const musicians = await payload.find({ collection: 'musicians', limit: 200, depth: 0, locale: LOCALE })
  const bySurname = new Map<string, number>()
  for (const m of musicians.docs) {
    const name = (m as { name?: string }).name ?? ''
    const surname = name.trim().split(/\s+/).pop()?.toLowerCase()
    if (surname) bySurname.set(surname, m.id as number)
  }
  log(`Musicians in CMS: ${musicians.docs.length}`)

  const series = await payload.find({ collection: 'recurring-series', limit: 100, depth: 0, locale: LOCALE })
  const seriesBySlug = new Map<string, number>()
  for (const s of series.docs) {
    seriesBySlug.set((s as { slug?: string }).slug ?? '', s.id as number)
  }

  // Shared placeholder source for events the old site has no photo for.
  const PLACEHOLDER_SRC = path.resolve(ROOT, 'public/images/placeholders/single.jpg')

  const mediaByFilename = async (filename: string): Promise<number | null> => {
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
      depth: 0,
    })
    return existing.docs[0] ? (existing.docs[0].id as number) : null
  }

  await fsp.mkdir(IMG_CACHE, { recursive: true })
  async function eventImage(ev: MecEvent, slug: string, alt: string): Promise<number | null> {
    try {
      if (ev.image) {
        const filename = decodeURIComponent(path.basename(new URL(ev.image).pathname))
        const existingId = await mediaByFilename(filename)
        if (existingId) return existingId
        const cached = path.join(IMG_CACHE, filename)
        try {
          await fsp.access(cached)
        } catch {
          const r = await fetch(ev.image)
          if (!r.ok) throw new Error(`photo ${r.status}`)
          await fsp.writeFile(cached, Buffer.from(await r.arrayBuffer()))
        }
        const created = await payload.create({ collection: 'media', data: { alt }, filePath: cached })
        return created.id as number
      }
      // No photo on the old site → per-event copy of the placeholder.
      const filename = `mec-${slug}.jpg`
      const existingId = await mediaByFilename(filename)
      if (existingId) return existingId
      const tmp = path.join(IMG_CACHE, filename)
      await fsp.copyFile(PLACEHOLDER_SRC, tmp)
      const created = await payload.create({ collection: 'media', data: { alt }, filePath: tmp })
      return created.id as number
    } catch (e) {
      log(`⚠ image for "${slug}" failed: ${(e as Error).message}`)
      return null
    }
  }

  // ── build import set ──────────────────────────────────────────────────────
  const importSlugs = new Set<string>()
  const prepared = mecEvents
    .map((ev) => {
      const slug = slugFromUrl(ev.url)
      if (!slug) {
        log(`⚠ skipping "${ev.title}" — no slug in url ${ev.url}`)
        return null
      }
      importSlugs.add(slug)
      return { ev, slug }
    })
    .filter(Boolean) as Array<{ ev: MecEvent; slug: string }>

  // ── delete future demo/seed events not present in the real programme ─────
  const future = await payload.find({
    collection: 'events',
    where: { date: { greater_than_equal: FROM_ISO } },
    limit: 500,
    depth: 0,
    locale: LOCALE,
  })
  for (const doc of future.docs) {
    const slug = (doc as { slug?: string | null }).slug
    if (slug && importSlugs.has(slug)) continue
    await payload.delete({ collection: 'events', id: doc.id })
    log(`🗑  removed demo event #${doc.id} "${(doc as { title?: string }).title}" (${(doc as { date?: string }).date})`)
  }

  // ── upsert real events (chronologically) ──────────────────────────────────
  let created = 0
  let updated = 0
  prepared.sort((a, b) => a.ev.start.localeCompare(b.ev.start))
  for (const { ev, slug } of prepared) {
    const title = decodeEntities(ev.title).replace(/\s+/g, ' ').trim()
    const { body, lines, priceZl } = parseDescription(ev.description)

    const performers: Array<{ musician: number; instrument: string }> = []
    for (const line of lines) {
      for (const m of line.matchAll(PERFORMER_RE)) {
        const surname = m[1].trim().split(/\s+/).pop()?.toLowerCase()
        const musicianId = surname ? bySurname.get(surname) : undefined
        if (musicianId && !performers.some((p) => p.musician === musicianId)) {
          performers.push({ musician: musicianId, instrument: m[2].trim().toLowerCase() })
        }
      }
    }

    const recurringSeries = /klub x muzy/i.test(title) ? seriesBySlug.get('klub-x-muzy') : undefined

    const data: Record<string, unknown> = {
      title,
      slug,
      generateSlug: false,
      eventType: 'standard',
      date: ev.start,
      endTime: ev.end_time || undefined,
      description: shortDescription(lines),
      body: body ?? undefined,
      price: priceZl ?? undefined,
      featured: false,
      showOnHomepage: true,
      shareEnabled: true,
      performers,
      recurringSeries,
      image: await eventImage(ev, slug, title),
      // Standard editable microcopy for the detail-page sections (same as seed).
      showUpcoming: true,
      performersHeading: 'Wykonawcy',
      upcomingHeading: 'Nadchodzące wydarzenia',
      shareLabel: 'Udostępnij to wydarzenie',
    }

    const existing = await payload.find({
      collection: 'events',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      locale: LOCALE,
    })
    if (existing.docs[0]) {
      await payload.update({ collection: 'events', id: existing.docs[0].id, data: data as never, locale: LOCALE })
      updated += 1
      log(`↻ updated  ${ev.start.slice(0, 10)}  ${title}`)
    } else {
      await payload.create({ collection: 'events', data: data as never, locale: LOCALE })
      created += 1
      log(`✚ created  ${ev.start.slice(0, 10)}  ${title}${performers.length ? `  (${performers.length} performers)` : ''}${priceZl ? `  ${priceZl} zł` : ''}`)
    }
  }

  log(`Done: ${created} created, ${updated} updated, ${future.docs.length - updated} demo removed.`)
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
