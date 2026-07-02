/**
 * One-off maintenance (2026-07): decouple media docs shared between page heroes
 * and the restaurant menu tiles.
 *
 * Found in prod (remote D1):
 *   - `restaurant` hero, ALL 18 menuGallery tile slots (pl+en) and the 4
 *     setMenu MENU A/B images point at ONE media doc — the client uploaded a
 *     menu graphic into it and it replaced the hero + every tile at once.
 *   - `program`, `business` and `kontakt-dla-artystow` heroes share their media
 *     doc with galleries / bento / artistCTA / events — replacing any of those
 *     bleeds into the hero (and vice versa).
 *
 * Fix: give every page hero and every menu tile slot its OWN media doc (own R2
 * object, duplicated from the currently displayed image, so nothing changes
 * visually). Also switches the restaurant menuGallery to the new A4/A5 paper
 * aspect ratio.
 *
 * Run against PRODUCTION (Node 22):
 *   NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true npx tsx scripts/decouple-media-2026-07.ts
 *
 * Idempotent: copies are keyed by filename (`*-2026-07.jpg`) and reused on
 * re-run; slots whose media doc is used only once are left untouched.
 */
import 'dotenv/config'
import os from 'os'
import path from 'path'
import { writeFile, unlink } from 'fs/promises'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import configPromise from '../src/payload.config'

const PROD_ORIGIN = process.env.PUBLIC_ORIGIN || 'https://american-dream.kilias07.workers.dev'
const LOCALES = ['pl', 'en'] as const
const SUFFIX = '2026-07'
const MENU_ASPECT = '707/1000' // A4/A5 paper (1:√2)

// Heroes found sharing their media doc with other sections in prod.
const HERO_SLUGS = ['restaurant', 'program', 'business', 'kontakt-dla-artystow']

type MediaDoc = { id: number; filename?: string | null; url?: string | null; alt?: string | null }

async function main() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  // filename → media id cache so pl+en of the same slot share one copy.
  const copyCache = new Map<string, number>()

  /** Duplicate `sourceId`'s file into a new media doc named `filename` (reusing
   * an existing doc with that filename). Returns the new media id. */
  async function copyMedia(sourceId: number, filename: string, alt: string): Promise<number | null> {
    if (copyCache.has(filename)) return copyCache.get(filename)!
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    })
    if (existing.docs[0]) {
      const id = existing.docs[0].id as number
      log(`↩ reusing existing copy #${id} (${filename})`)
      copyCache.set(filename, id)
      return id
    }
    const source = (await payload.findByID({ collection: 'media', id: sourceId })) as MediaDoc
    if (!source?.url) {
      log(`⚠ source media #${sourceId} has no url — skipping ${filename}`)
      return null
    }
    const resp = await fetch(`${PROD_ORIGIN}${source.url}`)
    if (!resp.ok) {
      log(`⚠ failed to fetch ${source.url} (${resp.status}) — skipping ${filename}`)
      return null
    }
    const buffer = Buffer.from(await resp.arrayBuffer())
    // `filePath` (not an in-memory buffer) — the buffer path writes the DB row
    // but leaves an EMPTY R2 object through the remote-bindings proxy.
    const tmp = path.join(os.tmpdir(), filename)
    await writeFile(tmp, buffer)
    let dup: MediaDoc
    try {
      dup = (await payload.create({
        collection: 'media',
        data: { alt },
        filePath: tmp,
      })) as MediaDoc
    } finally {
      await unlink(tmp).catch(() => {})
    }
    log(`✅ duplicated #${sourceId} → #${dup.id} (${dup.filename})`)
    copyCache.set(filename, dup.id)
    return dup.id
  }

  /** Verify the new R2 object actually serves bytes on the live site. */
  async function verifyCopies() {
    for (const [filename] of copyCache) {
      const resp = await fetch(`${PROD_ORIGIN}/api/media/file/${encodeURIComponent(filename)}`)
      const len = Number(resp.headers.get('content-length') || 0)
      if (!resp.ok || len === 0) {
        log(`❌ R2 object missing/empty for ${filename} (${resp.status}, ${len}B) — fix with: ` +
          `wrangler r2 object put american-dream/${filename} --file <img> --content-type image/jpeg --remote`)
      } else {
        log(`✓ ${filename} serves ${len}B`)
      }
    }
  }

  async function pageIdBySlug(slug: string): Promise<number | null> {
    const found = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
      locale: LOCALES[0],
    })
    return (found.docs[0]?.id as number) ?? null
  }

  // ── 1) Heroes: own media doc per page ─────────────────────────────────────
  for (const slug of HERO_SLUGS) {
    const pageId = await pageIdBySlug(slug)
    if (!pageId) {
      log(`⚠ page "${slug}" not found — skipped`)
      continue
    }
    let newId: number | null = null
    for (const locale of LOCALES) {
      const page = await payload.findByID({ collection: 'pages', id: pageId, depth: 0, locale, draft: false })
      const layout = Array.isArray(page.layout) ? page.layout : []
      const hero = layout.find((b) => b.blockType === 'pageHero') as
        | { backgroundImage?: number | null }
        | undefined
      if (!hero?.backgroundImage) {
        log(`⚠ ${slug} [${locale}] has no pageHero backgroundImage — skipped`)
        continue
      }
      if (newId == null) {
        newId = await copyMedia(
          hero.backgroundImage as number,
          `${slug}-hero-${SUFFIX}.jpg`,
          `${slug} — Hero`,
        )
      }
      if (newId == null) break
      if (hero.backgroundImage === newId) {
        log(`↩ ${slug} [${locale}] hero already decoupled`)
        continue
      }
      await payload.update({
        collection: 'pages',
        id: pageId,
        locale,
        depth: 0,
        data: {
          layout: layout.map((b) =>
            b.blockType === 'pageHero' ? { ...b, backgroundImage: newId } : b,
          ),
          _status: 'published',
        },
      })
      log(`✅ repointed ${slug} [${locale}] hero → media #${newId}`)
    }
  }

  // ── 2) Restaurant menu tiles + setMenu images: own doc per slot ───────────
  const restId = await pageIdBySlug('restaurant')
  if (!restId) {
    log('⚠ page "restaurant" not found — menu decoupling skipped')
  } else {
    // Count how often each media id is used across all menu slots + set menus
    // (both locales): a doc used once is already someone's own upload — keep it.
    const usage = new Map<number, number>()
    const bump = (id: unknown) => {
      if (typeof id === 'number') usage.set(id, (usage.get(id) || 0) + 1)
    }
    type Row = { layout?: string | null; left?: number | null; right?: number | null; full?: number | null }
    type SetMenuItem = { image?: number | null }
    for (const locale of LOCALES) {
      const page = await payload.findByID({ collection: 'pages', id: restId, depth: 0, locale, draft: false })
      for (const block of (page.layout as Array<Record<string, unknown>>) || []) {
        if (block.blockType === 'menuGallery') {
          for (const row of (block.rows as Row[]) || []) {
            bump(row.left); bump(row.right); bump(row.full)
          }
        }
        if (block.blockType === 'setMenu') {
          for (const m of (block.menus as SetMenuItem[]) || []) bump(m.image)
        }
        if (block.blockType === 'pageHero') bump(block.backgroundImage)
      }
    }

    const setMenuNames = ['a', 'b', 'c', 'd']
    for (const locale of LOCALES) {
      const page = await payload.findByID({ collection: 'pages', id: restId, depth: 0, locale, draft: false })
      let changed = false
      const nextLayout = [] as Array<Record<string, unknown>>
      for (const block of (page.layout as Array<Record<string, unknown>>) || []) {
        if (block.blockType === 'menuGallery') {
          const rows = [] as Row[]
          let i = 0
          for (const row of (block.rows as Row[]) || []) {
            i += 1
            const next: Row = { ...row }
            for (const side of ['left', 'right', 'full'] as const) {
              const id = next[side]
              if (typeof id === 'number' && (usage.get(id) || 0) > 1) {
                const copy = await copyMedia(
                  id,
                  `restaurant-menu-r${i}-${side}-${SUFFIX}.jpg`,
                  `Restauracja — menu, kafelek ${i} ${side}`,
                )
                if (copy != null && copy !== id) {
                  next[side] = copy
                  changed = true
                }
              }
            }
            rows.push(next)
          }
          const aspect = (block as { aspectRatio?: string }).aspectRatio
          if (aspect !== MENU_ASPECT) changed = true
          nextLayout.push({ ...block, rows, aspectRatio: MENU_ASPECT })
        } else if (block.blockType === 'setMenu') {
          const menus = [] as SetMenuItem[]
          let i = 0
          for (const m of (block.menus as SetMenuItem[]) || []) {
            const name = setMenuNames[i] || String(i + 1)
            i += 1
            const id = m.image
            if (typeof id === 'number' && (usage.get(id) || 0) > 1) {
              const copy = await copyMedia(
                id,
                `restaurant-setmenu-${name}-${SUFFIX}.jpg`,
                `Menu ${name.toUpperCase()} — zdjęcie`,
              )
              if (copy != null && copy !== id) {
                menus.push({ ...m, image: copy })
                changed = true
                continue
              }
            }
            menus.push(m)
          }
          nextLayout.push({ ...block, menus })
        } else {
          nextLayout.push(block)
        }
      }
      if (!changed) {
        log(`↩ restaurant [${locale}] menu already decoupled`)
        continue
      }
      await payload.update({
        collection: 'pages',
        id: restId,
        locale,
        depth: 0,
        data: { layout: nextLayout, _status: 'published' },
      })
      log(`✅ restaurant [${locale}] menu slots decoupled, aspectRatio=${MENU_ASPECT}`)
    }
  }

  await verifyCopies()

  // ── 3) Bust the ISR cache so the changes show up ──────────────────────────
  const secret = process.env.REVALIDATE_SECRET
  if (secret) {
    const resp = await fetch(`${PROD_ORIGIN}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify({ tag: 'pages' }),
    })
    log(`revalidate → ${resp.status}`)
  } else {
    log('⚠ REVALIDATE_SECRET not set — remember to POST /api/revalidate manually')
  }

  log('Done.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
