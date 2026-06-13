/**
 * One-shot backfill: give every existing `events` row a unique `slug`
 * (SEO audit — events are now addressed by /events/[slug]/ instead of
 * /program/[id]). New events get a slug from the slugField() hook; this script
 * only fills legacy rows whose slug is NULL after the add_event_slug migration.
 *
 * Run with: pnpm exec tsx scripts/backfill-event-slugs.ts
 * Idempotent: skips events that already have a slug.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const LOCALE = 'pl' as const

const PL_MAP: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (ch) => PL_MAP[ch] ?? ch)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function main() {
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'events',
    locale: LOCALE,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  const used = new Set<string>()
  for (const ev of docs) {
    const existing = (ev as { slug?: string | null }).slug
    if (existing) {
      used.add(existing)
    }
  }

  let updated = 0
  for (const ev of docs) {
    const existing = (ev as { slug?: string | null }).slug
    if (existing) continue

    const base = slugify((ev.title as string) || `event-${ev.id}`) || `event-${ev.id}`
    let slug = base
    let n = 2
    while (used.has(slug)) {
      slug = `${base}-${n++}`
    }
    used.add(slug)

    await payload.update({
      collection: 'events',
      id: ev.id,
      data: { slug } as never,
      locale: LOCALE,
      overrideAccess: true,
    })
    updated += 1
    console.log(`  events#${ev.id}  →  ${slug}`)
  }

  console.log(`\nBackfilled ${updated} / ${docs.length} event slug(s).`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
