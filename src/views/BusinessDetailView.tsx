import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { BlockRenderer } from '@/components/BlockRenderer'
import { brandTitle, buildMetadata } from '@/lib/audit-seo'
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
  const page = await getDetailPage(slug, locale)

  return buildMetadata({
    locale,
    path: `business/${slug}`,
    title: page?.meta?.title ?? brandTitle(page?.title ?? fallbackTitle(slug, locale)),
    description: page?.meta?.description ?? undefined,
  })
}
