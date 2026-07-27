/**
 * One-off maintenance: point the 21+ notice CTA at the club rules page.
 *
 * Problem: the `notice21Plus` block ("REGULAMIN KLUBU 21+" / "CLUB RULES 21+"
 * button) was seeded with `ctaUrl: '/contact'`, so the button opens the
 * contact page instead of the regulations.
 *
 * Fix: rewrite `ctaUrl` to `/regulamin` in every notice21Plus block, per
 * locale (the frontend prefixes `/en` itself via localeHref).
 *
 * Run against local dev DB:
 *   npx tsx scripts/fix-notice21-cta.ts
 * Run against PRODUCTION:
 *   NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true \
 *     npx tsx scripts/fix-notice21-cta.ts
 *
 * Idempotent: skips blocks that already point at /regulamin.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const LOCALES = ['pl', 'en'] as const
const TARGET_URL = '/regulamin'

async function main() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  const { docs: pages } = await payload.find({
    collection: 'pages',
    limit: 100,
    depth: 0,
    locale: LOCALES[0],
  })

  for (const { id, slug } of pages) {
    for (const locale of LOCALES) {
      const page = await payload.findByID({ collection: 'pages', id, depth: 0, locale, draft: false })
      const layout = Array.isArray(page.layout) ? page.layout : []
      let changed = false
      const nextLayout = layout.map((block) => {
        if (block.blockType === 'notice21Plus' && block.ctaUrl !== TARGET_URL) {
          changed = true
          return { ...block, ctaUrl: TARGET_URL }
        }
        return block
      })
      if (!changed) continue
      await payload.update({
        collection: 'pages',
        id,
        locale,
        depth: 0,
        data: { layout: nextLayout, _status: 'published' },
      })
      log(`✅ ${slug} [${locale}] notice21Plus ctaUrl → ${TARGET_URL}`)
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
