/**
 * Targeted seed of the `legal` global only (regulamin / privacy / companyData /
 * age21Notice), PL + EN. Mirrors the legal block in scripts/seed-adc.ts but
 * touches nothing else — safe to run against remote without disturbing pages,
 * events or other content.
 *
 * Remote:  PAYLOAD_FORCE_WRANGLER=true NODE_ENV=production pnpm exec tsx scripts/seed-legal.ts
 * Local:   pnpm exec tsx scripts/seed-legal.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import { legalContentPL, legalContentEN } from './legal-content'

async function main() {
  const payload = await getPayload({ config: configPromise })

  await payload.updateGlobal({
    slug: 'legal',
    locale: 'pl',
    data: {
      regulamin: legalContentPL.regulamin,
      privacy: legalContentPL.privacy,
      companyData: legalContentPL.companyData,
      age21Notice:
        'Uprzejmie informujemy, że American Dream Club jest miejscem przeznaczonym wyłącznie dla osób dorosłych powyżej 21. roku życia. Dziękujemy za zrozumienie i zapraszamy serdecznie wszystkich pełnoletnich miłośników dobrej zabawy!',
    } as never,
  })

  await payload.updateGlobal({
    slug: 'legal',
    locale: 'en',
    data: {
      regulamin: legalContentEN.regulamin,
      privacy: legalContentEN.privacy,
      companyData: legalContentEN.companyData,
      age21Notice:
        'Please note that American Dream Club is a venue reserved exclusively for adults aged 21 and over. Thank you for understanding — we warmly welcome all guests of legal age who love a great night out!',
    } as never,
  })

  console.log('✔ legal global seeded (pl + en): regulamin, privacy, companyData, age21Notice')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
