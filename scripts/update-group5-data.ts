/**
 * GRUPA 5 (uwagi klienta 2026-07, D6) — newsletter POD kalendarzem na stronie
 * program: wstawia blok `newsletterCTA` zaraz po `eventsCalendar`, jeśli strona
 * jeszcze go nie ma (pl + en).
 *
 * Lokalnie:  npx tsx scripts/update-group5-data.ts
 * Produkcja: NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true npx tsx scripts/update-group5-data.ts
 * Idempotentny.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const NEWSLETTER = {
  pl: {
    blockType: 'newsletterCTA',
    heading: 'NEWSLETTER',
    body: 'Zapisz się i bądź na bieżąco z programem koncertów.',
    placeholder: 'Adres email',
    buttonLabel: 'ZAPISZ SIĘ',
    consentText: 'Akceptuję politykę prywatności',
  },
  en: {
    blockType: 'newsletterCTA',
    heading: 'NEWSLETTER',
    body: 'Sign up and stay up to date with the concert programme.',
    placeholder: 'Email address',
    buttonLabel: 'SIGN UP',
    consentText: 'I accept the privacy policy',
  },
} as const

async function main() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  const found = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'program' } },
    limit: 1,
    depth: 0,
    locale: 'pl',
  })
  const pageId = found.docs[0]?.id
  if (!pageId) {
    log('⚠ strona program nie znaleziona')
    return
  }

  for (const locale of ['pl', 'en'] as const) {
    const page = await payload.findByID({ collection: 'pages', id: pageId, depth: 0, locale, draft: false })
    const layout = (Array.isArray(page.layout) ? page.layout : []) as Record<string, unknown>[]
    if (layout.some((b) => b.blockType === 'newsletterCTA')) {
      log(`↩ program [${locale}]: newsletterCTA już jest`)
      continue
    }
    const calIdx = layout.findIndex((b) => b.blockType === 'eventsCalendar')
    if (calIdx === -1) {
      log(`⚠ program [${locale}]: brak bloku eventsCalendar — pomijam`)
      continue
    }
    const nextLayout = [...layout.slice(0, calIdx + 1), NEWSLETTER[locale], ...layout.slice(calIdx + 1)]
    await payload.update({
      collection: 'pages',
      id: pageId,
      locale,
      depth: 0,
      data: { layout: nextLayout, _status: 'published' } as never,
    })
    log(`✅ program [${locale}]: newsletterCTA wstawiony pod kalendarzem`)
  }

  log('Done.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
