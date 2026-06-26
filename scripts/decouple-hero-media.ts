/**
 * One-off maintenance: decouple shared hero background images.
 *
 * Problem: two pairs of pages share the SAME media document as their hero
 * background, so replacing/editing that image bleeds across both pages:
 *   - media used by `restaurant`  AND `rezerwacje`
 *   - media used by `bar-and-cocktails` AND `contact`
 *
 * Fix: duplicate the shared media (own copy of the file in R2 + own doc) and
 * repoint the SECOND page of each pair (`rezerwacje`, `contact`) to its own
 * copy. After this, every page hero owns its background — editing one never
 * affects another.
 *
 * Run against PRODUCTION:
 *   NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true \
 *     npx tsx scripts/decouple-hero-media.ts
 *
 * Idempotent: skips a page whose hero already points to a non-shared media.
 */
import 'dotenv/config'
import os from 'os'
import path from 'path'
import { writeFile, unlink } from 'fs/promises'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const PROD_ORIGIN = process.env.PUBLIC_ORIGIN || 'https://american-dream.kilias07.workers.dev'
const LOCALES = ['pl', 'en'] as const

// Pairs to decouple: repoint `pageSlug` off the shared media onto its own copy.
const TARGETS = [
  { pageSlug: 'rezerwacje', sharedFilename: 'RESTAURACJA2.jpg', newFilename: 'rezerwacje-hero.jpg', newAlt: 'Rezerwacja — Hero' },
  { pageSlug: 'contact', sharedFilename: 'bar.jpg', newFilename: 'contact-hero.jpg', newAlt: 'Kontakt — Hero' },
]

async function main() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  for (const t of TARGETS) {
    // 1) Resolve the shared source media doc by filename.
    const src = await payload.find({
      collection: 'media',
      where: { filename: { equals: t.sharedFilename } },
      limit: 1,
    })
    const source = src.docs[0]
    if (!source) {
      log(`⚠ source media "${t.sharedFilename}" not found — skipping ${t.pageSlug}`)
      continue
    }

    // 2) Reuse an existing copy if a previous run already created it
    //    (idempotent — avoids piling up duplicate media docs).
    const existingDup = await payload.find({
      collection: 'media',
      where: { filename: { equals: t.newFilename } },
      limit: 1,
    })
    let dup = existingDup.docs[0]
    if (dup) {
      log(`↩ reusing existing copy #${dup.id} (${dup.filename})`)
    } else {
      // Download the original bytes from the public site.
      const fileUrl = `${PROD_ORIGIN}${source.url}`
      const resp = await fetch(fileUrl)
      if (!resp.ok) {
        log(`⚠ failed to fetch ${fileUrl} (${resp.status}) — skipping ${t.pageSlug}`)
        continue
      }
      const buffer = Buffer.from(await resp.arrayBuffer())

      // Write to a temp file and create via `filePath` — the in-memory `file`
      // buffer path does NOT reliably upload through the remote R2 proxy
      // (it writes the DB row but leaves an empty R2 object). `filePath` is the
      // same path the seed uses and uploads the bytes correctly.
      // Basename becomes the uploaded media filename, so name it exactly.
      const tmp = path.join(os.tmpdir(), t.newFilename)
      await writeFile(tmp, buffer)
      try {
        dup = await payload.create({
          collection: 'media',
          data: { alt: t.newAlt },
          filePath: tmp,
        })
      } finally {
        await unlink(tmp).catch(() => {})
      }
      log(`✅ duplicated #${source.id} (${t.sharedFilename}) → #${dup.id} (${dup.filename})`)
    }

    // 4) Repoint the page's hero backgroundImage to the new doc, per locale,
    //    rewriting only that one field in the pageHero block.
    const found = await payload.find({
      collection: 'pages',
      where: { slug: { equals: t.pageSlug } },
      limit: 1,
      depth: 0,
      locale: LOCALES[0],
    })
    const pageId = found.docs[0]?.id
    if (!pageId) {
      log(`⚠ page "${t.pageSlug}" not found — created media #${dup.id} but did not repoint`)
      continue
    }

    for (const locale of LOCALES) {
      const page = await payload.findByID({ collection: 'pages', id: pageId, depth: 0, locale, draft: false })
      const layout = Array.isArray(page.layout) ? page.layout : []
      let changed = false
      const nextLayout = layout.map((block) => {
        if (block.blockType === 'pageHero') {
          changed = true
          return { ...block, backgroundImage: dup.id }
        }
        return block
      })
      if (!changed) {
        log(`⚠ ${t.pageSlug} [${locale}] has no pageHero block — skipped`)
        continue
      }
      await payload.update({
        collection: 'pages',
        id: pageId,
        locale,
        depth: 0,
        data: { layout: nextLayout, _status: 'published' },
      })
      log(`✅ repointed ${t.pageSlug} [${locale}] hero → media #${dup.id}`)
    }
  }

  log('Done.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
