import { getPayload } from 'payload'
import { permanentRedirect } from 'next/navigation'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { BlockRenderer } from '@/components/BlockRenderer'
import { auditEntry, brandDescription, brandTitle, buildMetadata } from '@/lib/audit-seo'
import { localeHref } from '@/utilities/href'
import { toTitleCase } from '@/utilities/titleCase'

// Fixed set of business sub-pages. Each is backed by a `pages` row with slug
// `business-${slug}` (e.g. /business/christmas -> page `business-christmas`).
export const BUSINESS_SLUGS = ['christmas', 'meetings', 'birthday', 'stag', 'venue-hire'] as const

const TITLE_FALLBACKS: Record<string, { pl: string; en: string }> = {
  christmas: { pl: 'Wigilie Firmowe', en: 'Company Christmas Parties' },
  meetings: { pl: 'Spotkania Firmowe', en: 'Corporate Meetings' },
  birthday: { pl: 'Urodziny', en: 'Birthdays' },
  stag: { pl: 'Wieczory Kawalerskie', en: 'Stag Nights' },
  'venue-hire': { pl: 'Wynajem Sali', en: 'Venue Hire' },
}

// Weryfikacja audytu 2026-08-06, punkt 5: podstrony /business/[slug] miały
// title i h1, ale ŻADNEJ meta description. Szablon audytu: ~180 znaków opisu
// danego typu imprezy; Title Case dokłada `buildMetadata`. Wartość z CMS
// (`page.meta.description`) ma pierwszeństwo — to tylko fallback.
const DESCRIPTION_FALLBACKS: Record<string, { pl: string; en: string }> = {
  christmas: {
    pl: 'Wigilie i imprezy świąteczne dla firm w centrum Poznania. Sala na wyłączność, menu ustalane indywidualnie, muzyka na żywo i pełna obsługa dla grup do 120 osób.',
    en: 'Company Christmas parties and festive events in the centre of Poznań. Exclusive use of the room, a menu agreed individually, live music and full service for up to 120 guests.',
  },
  meetings: {
    pl: 'Spotkania firmowe, konferencje i kolacje biznesowe w klubowej atmosferze w centrum Poznania. Eleganckie sale, menu grupowe w stałej cenie i pełna obsługa.',
    en: 'Corporate meetings, conferences and business dinners in a club atmosphere in the centre of Poznań. Elegant rooms, a group menu at a fixed price and full service.',
  },
  birthday: {
    pl: 'Urodziny i rocznice w centrum Poznania. Kameralna sala, kolacja przy muzyce na żywo i oprawa wieczoru ustalona indywidualnie — Ty przychodzisz z Gośćmi.',
    en: 'Birthdays and anniversaries in the centre of Poznań. An intimate room, dinner with live music and an evening arranged individually — you just arrive with your guests.',
  },
  stag: {
    pl: 'Wieczory kawalerskie i panieńskie w American Dream Club w Poznaniu. Cocktail bar, muzyka na żywo, cigar lounge i scenariusz wieczoru dopasowany do grupy.',
    en: 'Stag and hen nights at American Dream Club in Poznań. A cocktail bar, live music, a cigar lounge and an evening planned around your group.',
  },
  'venue-hire': {
    pl: 'Wynajem sali na imprezy w centrum Poznania. Cały lokal lub wybrana strefa na wyłączność, catering serwowany albo bufetowy, open bar i oprawa muzyczna.',
    en: 'Venue hire for events in the centre of Poznań. The whole club or a chosen zone exclusively, plated or buffet catering, an open bar and live music.',
  },
}

function isKnownSlug(slug: string): slug is (typeof BUSINESS_SLUGS)[number] {
  return (BUSINESS_SLUGS as readonly string[]).includes(slug)
}

function pageSlug(slug: string): string {
  return `business-${slug}`
}

async function getDetailPage(slug: string, locale: Locale): Promise<Page | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'pages',
      where: { slug: { equals: pageSlug(slug) } },
      locale,
      fallbackLocale: defaultLocale,
      depth: 2,
      limit: 1,
    })
    return result.docs[0] ?? null
  } catch {
    return null
  }
}

function fallbackTitle(slug: string, locale: Locale): string {
  return TITLE_FALLBACKS[slug]?.[locale] ?? slug
}

function EmptyShell({ title }: { title: string }) {
  return (
    <div className="bg-brand-navy text-white">
      <section className="py-16 md:py-24 text-center bg-brand-navy-royal">
        <div className="max-w-[1280px] mx-auto px-6">
          <p className="text-brand-gold text-sm font-semibold uppercase tracking-[0.2em] mb-3">
            American Dream Club
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold uppercase tracking-tight">
            {title}
          </h1>
        </div>
      </section>
    </div>
  )
}

export async function renderBusinessDetail(slug: string, locale: Locale) {
  // Weryfikacja audytu 2026-08-06, punkt 2: dowolny slug pod /business zwracał
  // 200 z pustą stroną tytułowaną samym slugiem — nieskończony zbiór soft-404.
  // Nieznany slug idzie teraz na listing, tak jak w /events i /news.
  if (!isKnownSlug(slug)) permanentRedirect(localeHref(locale, '/business'))

  const cachedGetPage = unstable_cache(
    () => getDetailPage(slug, locale),
    [`page-${pageSlug(slug)}-${locale}`],
    { tags: [`page-${pageSlug(slug)}`, 'pages'] },
  )
  const page = await cachedGetPage()

  // Structure placeholder — never 404 for a known business sub-page.
  if (!page || !page.layout || page.layout.length === 0) {
    return <EmptyShell title={toTitleCase(page?.title ?? fallbackTitle(slug, locale))} />
  }

  return <BlockRenderer blocks={page.layout} locale={locale} />
}

export function businessDetailStaticParams() {
  return BUSINESS_SLUGS.map((slug) => ({ slug }))
}

export async function businessDetailMetadata(slug: string, locale: Locale) {
  // Unknown slugs never render (renderBusinessDetail redirects), so don't emit
  // metadata that would advertise them as real pages.
  if (!isKnownSlug(slug)) {
    const listing = auditEntry('business', locale)
    return buildMetadata({
      locale,
      path: 'business',
      title: listing.title,
      description: listing.description,
      keywords: listing.keywords,
    })
  }

  const page = await getDetailPage(slug, locale)

  return buildMetadata({
    locale,
    path: `business/${slug}`,
    title: page?.meta?.title ?? brandTitle(page?.title ?? fallbackTitle(slug, locale)),
    description:
      page?.meta?.description ?? brandDescription(DESCRIPTION_FALLBACKS[slug]?.[locale]),
  })
}
