/**
 * Jednorazowa naprawa slugów z białymi znakami (weryfikacja audytu 2026-08-06,
 * punkt 7). Na produkcji część wydarzeń miała slug ze spacją na końcu
 * (`przerwa-urlopowa-10 `), przez co karty na /events linkowały do adresu
 * z `%20` i wracały na listing zamiast otwierać stronę wydarzenia.
 *
 * Zapis w CMS jest już zabezpieczony (hook `beforeChange` w Events), ten skrypt
 * czyści to, co zdążyło wejść do bazy — także w pozostałych kolekcjach ze
 * slugiem, bo problem nie jest z natury specyficzny dla wydarzeń.
 *
 * Lokalnie:
 *   pnpm tsx scripts/fix-slug-whitespace.ts
 * Na produkcji (D1 klienta):
 *   NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true pnpm tsx scripts/fix-slug-whitespace.ts
 *
 * Domyślnie tylko raportuje. Faktyczny zapis: dopisz `--apply`.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const COLLECTIONS = ['events', 'posts', 'pages', 'recurring-series'] as const

const apply = process.argv.includes('--apply')

function clean(slug: string): string {
  return slug.trim().replace(/\s+/g, '-')
}

const payload = await getPayload({ config })

let found = 0
let fixed = 0

for (const collection of COLLECTIONS) {
  const { docs } = await payload.find({
    collection,
    pagination: false,
    depth: 0,
    select: { slug: true },
  })

  for (const doc of docs as { id: number | string; slug?: string | null }[]) {
    const slug = doc.slug
    if (typeof slug !== 'string' || slug === clean(slug)) continue

    found++
    const next = clean(slug)
    console.log(`${collection}#${doc.id}: ${JSON.stringify(slug)} -> ${JSON.stringify(next)}`)

    if (!apply) continue

    // `generateSlug: false` stops slugField from re-deriving the value from the
    // title and undoing the fix.
    await payload.update({
      collection,
      id: doc.id,
      data: { slug: next, generateSlug: false } as never,
      // Skip the one-event-per-day validator etc. — we're touching only the slug.
      overrideAccess: true,
    })
    fixed++
  }
}

console.log(
  found === 0
    ? 'Brak slugów z białymi znakami — nic do naprawy.'
    : apply
      ? `Naprawiono ${fixed}/${found}.`
      : `Znaleziono ${found}. Uruchom ponownie z --apply, żeby zapisać.`,
)

process.exit(0)
