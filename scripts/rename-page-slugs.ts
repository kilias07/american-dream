/**
 * SEO audit — rename existing `pages` rows' slugs to the English scheme.
 * Run with: pnpm exec tsx scripts/rename-page-slugs.ts
 *
 * Idempotent: for each {old -> new}, finds the page by old slug and updates it.
 * Skips when the old slug no longer exists (already renamed) or a row with the
 * new slug already exists.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const RENAMES: Array<[string, string]> = [
  ['restauracja', 'restaurant'],
  ['bar', 'bar-and-cocktails'],
  ['cigar-room', 'cigar-lounge'],
  ['twoje-wydarzenie', 'business'],
  ['kontakt', 'contact'],
]

async function run() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  for (const [oldSlug, newSlug] of RENAMES) {
    // Bail out if the new slug already exists (don't create a duplicate).
    const newExisting = await payload.find({
      collection: 'pages',
      where: { slug: { equals: newSlug } },
      limit: 1,
      locale: 'pl',
    })
    if (newExisting.docs[0]) {
      log(`= page '${newSlug}' already exists — skipping rename of '${oldSlug}'`)
      continue
    }

    const oldExisting = await payload.find({
      collection: 'pages',
      where: { slug: { equals: oldSlug } },
      limit: 1,
      locale: 'pl',
    })
    if (!oldExisting.docs[0]) {
      log(`= page '${oldSlug}' not found — nothing to rename`)
      continue
    }

    await payload.update({
      collection: 'pages',
      id: oldExisting.docs[0].id,
      data: { slug: newSlug } as never,
      locale: 'pl',
    })
    log(`✔ renamed page '${oldSlug}' -> '${newSlug}' (#${oldExisting.docs[0].id})`)
  }

  log('Done renaming page slugs.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
