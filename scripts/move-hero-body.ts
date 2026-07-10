/**
 * GRUPA 2 (uwagi klienta 2026-07) — przeniesienie tekstu spod hero NA hero.
 *
 * Dla każdej strony (pl + en): jeśli zaraz po bloku `pageHero` stoi `aboutIntro`
 * z `body`, przenosi to `body` do `pageHero.body` i usuwa blok aboutIntro.
 * Heading/subheading aboutIntro celowo znikają — projekt klienta pokazuje na
 * hero wyłącznie eyebrow + title + body. Home (heroBanner) nietknięty.
 *
 * Lokalnie:  npx tsx scripts/move-hero-body.ts
 * Produkcja: NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true npx tsx scripts/move-hero-body.ts
 * Idempotentny (drugi run: po hero nie stoi już aboutIntro → no-op).
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const LOCALES = ['pl', 'en'] as const

function transform(layout: Record<string, unknown>[]): Record<string, unknown>[] | null {
  const heroIdx = layout.findIndex((b) => b.blockType === 'pageHero')
  const next = layout[heroIdx + 1]
  if (heroIdx === -1 || !next || next.blockType !== 'aboutIntro' || !next.body) return null
  return layout
    .map((b, i) => (i === heroIdx ? { ...b, body: next.body } : b))
    .filter((_, i) => i !== heroIdx + 1)
}

async function main() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  const { docs } = await payload.find({ collection: 'pages', limit: 100, depth: 0, locale: 'pl' })
  for (const doc of docs) {
    for (const locale of LOCALES) {
      const page = await payload.findByID({
        collection: 'pages',
        id: doc.id,
        depth: 0,
        locale,
        draft: false,
      })
      const layout = (Array.isArray(page.layout) ? page.layout : []) as Record<string, unknown>[]
      const next = transform(layout)
      if (!next) {
        log(`↩ ${page.slug} [${locale}]: nic do przeniesienia`)
        continue
      }
      await payload.update({
        collection: 'pages',
        id: doc.id,
        locale,
        depth: 0,
        data: { layout: next, _status: 'published' } as never,
      })
      log(`✅ ${page.slug} [${locale}]: body → hero, aboutIntro usunięty`)
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
