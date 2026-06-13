/**
 * SEO audit — upsert empty PUBLISHED `pages` rows for the new routes.
 * Run with: pnpm exec tsx scripts/seed-new-pages.ts
 *
 * These are STRUCTURE placeholders — the views render BlockRenderer over the
 * page `layout`; content is filled later in admin. Each row gets a Polish title
 * (canonical PL locale) plus an English title (EN locale) and an empty layout.
 * Idempotent: matches by slug on the PL locale and updates in place.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

type NewPage = { slug: string; titlePl: string; titleEn: string }

const PAGES: NewPage[] = [
  { slug: 'business', titlePl: 'Organizacja Imprez', titleEn: 'Events & Business' },
  { slug: 'business-christmas', titlePl: 'Wigilie Firmowe', titleEn: 'Company Christmas Parties' },
  { slug: 'business-meetings', titlePl: 'Spotkania Firmowe', titleEn: 'Corporate Meetings' },
  { slug: 'business-birthday', titlePl: 'Urodziny', titleEn: 'Birthdays' },
  { slug: 'business-stag', titlePl: 'Wieczory Kawalerskie', titleEn: 'Stag Nights' },
  { slug: 'business-venue-hire', titlePl: 'Wynajem Sali', titleEn: 'Venue Hire' },
  {
    slug: 'pod-papugami',
    titlePl: 'Pod Papugami To Teraz American Dream Club',
    titleEn: 'Pod Papugami Is Now American Dream Club',
  },
  { slug: 'events-listing', titlePl: 'Wydarzenia', titleEn: 'Events' },
]

async function run() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  for (const p of PAGES) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: p.slug } },
      limit: 1,
      locale: 'pl',
    })

    let id: number
    if (existing.docs[0]) {
      id = existing.docs[0].id as number
      // Only set title if the row is still a bare placeholder (no layout) — never
      // overwrite content an editor may have filled in.
      const hasLayout = Array.isArray((existing.docs[0] as { layout?: unknown[] }).layout)
        ? ((existing.docs[0] as { layout?: unknown[] }).layout?.length ?? 0) > 0
        : false
      if (!hasLayout && !existing.docs[0].title) {
        await payload.update({
          collection: 'pages',
          id,
          data: { title: p.titlePl } as never,
          locale: 'pl',
        })
      }
      log(`= page '${p.slug}' already exists (#${id})`)
    } else {
      const created = await payload.create({
        collection: 'pages',
        data: { title: p.titlePl, slug: p.slug, layout: [] } as never,
        locale: 'pl',
      })
      id = created.id as number
      log(`✔ created page '${p.slug}' (#${id})`)
    }

    // EN title (localized).
    await payload.update({
      collection: 'pages',
      id,
      data: { title: p.titleEn } as never,
      locale: 'en',
    })

    // Publish.
    try {
      await payload.update({
        collection: 'pages',
        id,
        data: { _status: 'published' } as never,
        locale: 'pl',
      })
    } catch {
      /* already published */
    }
  }

  log('Done seeding new placeholder pages.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
