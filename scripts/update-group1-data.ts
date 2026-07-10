/**
 * GRUPA 1 (uwagi klienta 2026-07) — aktualizacja danych:
 *  1. site-settings.social: dopisuje wpis `googleMaps` (wizytówka Google) na końcu
 *     tablicy (= skrajnie prawa ikona w top barze), jeśli go jeszcze nie ma.
 *  2. home.eventsTeaser.limit → 30 (pl + en) — karuzela pokazuje ~2–3 tygodnie.
 *
 * Lokalnie:  npx tsx scripts/update-group1-data.ts
 * Produkcja: NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true npx tsx scripts/update-group1-data.ts
 * Idempotentny.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const GOOGLE_MAPS_URL = 'https://share.google/rvlxbSYG9HNop2tiE'
const LOCALES = ['pl', 'en'] as const

async function main() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  // 1) social → googleMaps
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
  const social = (settings.social ?? []) as { platform?: string | null; url?: string | null }[]
  if (social.some((s) => s.platform === 'googleMaps')) {
    log('↩ social: googleMaps już istnieje — pomijam')
  } else {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        social: [
          ...social.map((s) => ({ platform: s.platform, url: s.url })),
          { platform: 'googleMaps', url: GOOGLE_MAPS_URL },
        ],
      } as never,
    })
    log('✅ social: dodano googleMaps (ostatnia = skrajnie prawa)')
  }

  // 2) home eventsTeaser.limit → 30 (per locale; layout nie jest współdzielony 1:1,
  //    ale limit to pole nielokalizowane bloku — aktualizujemy przez pl i en dla pewności)
  const found = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
    locale: 'pl',
  })
  const pageId = found.docs[0]?.id
  if (!pageId) {
    log('⚠ strona home nie znaleziona')
    return
  }
  for (const locale of LOCALES) {
    const page = await payload.findByID({ collection: 'pages', id: pageId, depth: 0, locale, draft: false })
    const layout = (Array.isArray(page.layout) ? page.layout : []) as Record<string, unknown>[]
    let changed = false
    const nextLayout = layout.map((block) => {
      if (block.blockType === 'eventsTeaser' && (block.limit as number) !== 30) {
        changed = true
        return { ...block, limit: 30 }
      }
      return block
    })
    if (!changed) {
      log(`↩ home [${locale}]: eventsTeaser.limit już 30 (lub brak bloku)`)
      continue
    }
    await payload.update({
      collection: 'pages',
      id: pageId,
      locale,
      depth: 0,
      data: { layout: nextLayout, _status: 'published' } as never,
    })
    log(`✅ home [${locale}]: eventsTeaser.limit → 30`)
  }

  log('Done.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
