/**
 * Targeted, idempotent: uploads the hero background video to R2 as a Media doc
 * (via the Local API, i.e. through the CMS) and wires it into the home page's
 * heroBanner block(s). Does NOT touch any other content.
 *
 * Run against PRODUCTION (remote D1 + R2):
 *   NODE_ENV=production PAYLOAD_SECRET=ignore tsx scripts/set-hero-video.ts
 */
import 'dotenv/config'
import path from 'path'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function run() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)
  const ROOT = process.cwd()

  // 1. Media (R2) — find existing by filename or create from disk.
  const filename = 'hero-banner.mp4'
  let mediaId: number
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  })
  if (existing.docs[0]) {
    mediaId = existing.docs[0].id as number
    log(`media exists #${mediaId} (${filename})`)
  } else {
    const created = await payload.create({
      collection: 'media',
      data: { alt: 'American Dream Club — film w tle hero' },
      filePath: path.resolve(ROOT, 'scripts/assets/hero-banner.mp4'),
    })
    mediaId = created.id as number
    log(`media created #${mediaId} (${filename})`)
  }

  // 2. Wire into the home page heroBanner block(s), per locale, and publish.
  for (const locale of ['pl', 'en'] as const) {
    const res = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
      limit: 1,
      locale,
      depth: 0,
    })
    const page = res.docs[0]
    if (!page) {
      log(`⚠ home page not found (${locale})`)
      continue
    }
    const layout = ((page.layout as any[]) || []).map((b) =>
      b.blockType === 'heroBanner' ? { ...b, backgroundVideo: mediaId } : b,
    )
    const heroCount = layout.filter((b: any) => b.blockType === 'heroBanner').length
    await payload.update({
      collection: 'pages',
      id: page.id,
      locale,
      data: { layout, _status: 'published' } as never,
    })
    log(`home hero updated (${locale}): ${heroCount} block(s) → media #${mediaId}`)
  }

  log('Done.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
