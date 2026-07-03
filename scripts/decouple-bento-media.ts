/**
 * One-off maintenance: decouple the home page's venue bento tile images.
 *
 * Problem: the 4 home CTA tiles (KONCERTY / RESTAURACJA / COCKTAIL BAR / CIGAR
 * ROOM) reused the shared `program/restauracja/bar/cigar` placeholder media
 * docs — the same docs the cocktail-bar page uses — so replacing a home tile's
 * photo in the CMS would bleed onto another page.
 *
 * Fix: give each tile its OWN media doc (`home-bento-<key>.jpg`, uploaded from
 * the local placeholder, identical filename to what the seed's `slotImg` now
 * creates) and repoint the home bentoSection items to them, per locale.
 *
 * Run against PRODUCTION (mirrors decouple-hero-media.ts):
 *   NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true \
 *     npx tsx scripts/decouple-bento-media.ts
 *
 * Idempotent: reuses the dedicated docs if a previous run created them, and the
 * repoint is a no-op once the tiles already point at them.
 */
import 'dotenv/config'
import os from 'os'
import path from 'path'
import { copyFile, unlink } from 'fs/promises'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const ROOT = process.cwd()
const LOCALES = ['pl', 'en'] as const

// Order matches the home bentoSection items (program, restauracja, bar, cigar).
const TILES = [
  { key: 'home-bento-program', src: 'public/images/placeholders/program.jpg', alt: 'Koncert na żywo' },
  { key: 'home-bento-restauracja', src: 'public/images/placeholders/restauracja.jpg', alt: 'Restauracja — danie' },
  { key: 'home-bento-bar', src: 'public/images/placeholders/bar.jpg', alt: 'Cocktail bar — koktajl' },
  { key: 'home-bento-cigar', src: 'public/images/placeholders/cigar.jpg', alt: 'Cigar room — wnętrze' },
]

async function ensureDoc(payload: Awaited<ReturnType<typeof getPayload>>, key: string, src: string, alt: string) {
  const filename = `${key}.jpg`
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1 })
  if (existing.docs[0]) return existing.docs[0].id as number
  // Upload via `filePath` (basename becomes the media filename) — the in-memory
  // buffer path does NOT upload reliably through the remote R2 proxy.
  const tmp = path.join(os.tmpdir(), filename)
  await copyFile(path.resolve(ROOT, src), tmp)
  try {
    const created = await payload.create({ collection: 'media', data: { alt }, filePath: tmp })
    return created.id as number
  } finally {
    await unlink(tmp).catch(() => {})
  }
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  // 1) Create/find the 4 dedicated media docs (one per tile).
  const ids: number[] = []
  for (const t of TILES) {
    const id = await ensureDoc(payload, t.key, t.src, t.alt)
    ids.push(id)
    log(`media ${t.key}.jpg → #${id}`)
  }

  // 2) Locate the home page.
  const found = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
    locale: LOCALES[0],
  })
  const pageId = found.docs[0]?.id
  if (!pageId) {
    log('⚠ home page not found — created media but did not repoint')
    return
  }

  // 3) Repoint the venue bento items, per locale (only the 4-item venue bento).
  for (const locale of LOCALES) {
    const page = await payload.findByID({ collection: 'pages', id: pageId, depth: 0, locale, draft: false })
    const layout = (Array.isArray(page.layout) ? page.layout : []) as unknown as Record<
      string,
      unknown
    >[]
    let changed = false
    const nextLayout = layout.map((block) => {
      if (
        block.blockType === 'bentoSection' &&
        Array.isArray(block.items) &&
        block.items.length === TILES.length
      ) {
        changed = true
        const items = (block.items as Record<string, unknown>[]).map((it, i) => ({ ...it, image: ids[i] }))
        return { ...block, items }
      }
      return block
    })
    if (!changed) {
      log(`⚠ home [${locale}] has no 4-item bentoSection — skipped`)
      continue
    }
    await payload.update({
      collection: 'pages',
      id: pageId,
      locale,
      depth: 0,
      data: { layout: nextLayout, _status: 'published' } as never,
    })
    log(`✅ repointed home [${locale}] bento tiles → #${ids.join(', #')}`)
  }

  log('Done.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
