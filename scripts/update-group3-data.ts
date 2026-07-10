/**
 * GRUPA 3 (uwagi klienta 2026-07) — aktualizacja danych:
 *  1. cigar-lounge: requireAgeGate = true (popup 18+).
 *  2. rezerwacje: środkowa faza (linkToCalendar) → primary „KUP BILET"/„BUY
 *     TICKET" z ikoną biletu, secondary „PROGRAM" → /events.
 *  3. ui-labels: teksty popupu 18+ (pl + en).
 *
 * Lokalnie:  npx tsx scripts/update-group3-data.ts
 * Produkcja: NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true npx tsx scripts/update-group3-data.ts
 * Idempotentny.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const AGE_GATE = {
  pl: {
    title: 'Strona tylko dla użytkowników 18+',
    body: 'Ta część serwisu przeznaczona jest wyłącznie dla osób pełnoletnich. Czy masz ukończone 18 lat?',
    confirmLabel: 'TAK — JESTEM PEŁNOLETNI',
    declineLabel: 'NIE',
  },
  en: {
    title: 'This page is for adults (18+) only',
    body: 'This section of the site is intended for adults only. Are you 18 or older?',
    confirmLabel: 'YES — I AM 18+',
    declineLabel: 'NO',
  },
} as const

async function main() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  // 1) cigar-lounge → requireAgeGate
  const cigar = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'cigar-lounge' } },
    limit: 1,
    depth: 0,
    locale: 'pl',
  })
  const cigarId = cigar.docs[0]?.id
  if (cigarId) {
    if (cigar.docs[0]?.requireAgeGate === true) {
      log('↩ cigar-lounge: requireAgeGate już włączony')
    } else {
      await payload.update({ collection: 'pages', id: cigarId, data: { requireAgeGate: true } as never })
      log('✅ cigar-lounge: requireAgeGate = true')
    }
  } else {
    log('⚠ cigar-lounge nie znaleziony')
  }

  // 2) rezerwacje → środkowa faza KUP BILET + ikona ticket
  const rez = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'rezerwacje' } },
    limit: 1,
    depth: 0,
    locale: 'pl',
  })
  const rezId = rez.docs[0]?.id
  if (rezId) {
    for (const locale of ['pl', 'en'] as const) {
      const label = locale === 'pl' ? 'KUP BILET' : 'BUY TICKET'
      const page = await payload.findByID({ collection: 'pages', id: rezId, depth: 0, locale, draft: false })
      const layout = (Array.isArray(page.layout) ? page.layout : []) as Record<string, unknown>[]
      let changed = false
      const nextLayout = layout.map((block) => {
        if (block.blockType !== 'eveningPhases' || !Array.isArray(block.phases)) return block
        const phases = (block.phases as Record<string, unknown>[]).map((phase) => {
          if (phase.linkToCalendar) {
            if (phase.primaryCtaLabel !== label || phase.primaryCtaIcon !== 'ticket') {
              changed = true
              return {
                ...phase,
                primaryCtaLabel: label,
                primaryCtaIcon: 'ticket',
                secondaryCtaLabel: 'PROGRAM',
                secondaryCtaUrl: '/events',
              }
            }
            return phase
          }
          if (phase.primaryCtaIcon !== 'reserve') {
            changed = true
            return { ...phase, primaryCtaIcon: 'reserve' }
          }
          return phase
        })
        return { ...block, phases }
      })
      if (!changed) {
        log(`↩ rezerwacje [${locale}]: fazy już zaktualizowane`)
        continue
      }
      await payload.update({
        collection: 'pages',
        id: rezId,
        locale,
        depth: 0,
        data: { layout: nextLayout, _status: 'published' } as never,
      })
      log(`✅ rezerwacje [${locale}]: środkowa faza → ${label} (ikona bilet)`)
    }
  } else {
    log('⚠ rezerwacje nie znalezione')
  }

  // 3) ui-labels → teksty popupu 18+
  for (const locale of ['pl', 'en'] as const) {
    await payload.updateGlobal({
      slug: 'ui-labels',
      locale,
      data: { ageGate: AGE_GATE[locale] } as never,
    })
    log(`✅ ui-labels [${locale}]: ageGate teksty ustawione`)
  }

  log('Done.')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
