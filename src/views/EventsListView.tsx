import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'
import { auditEntry, buildMetadata } from '@/lib/audit-seo'
import { BlockRenderer } from '@/components/BlockRenderer'

// The canonical Program page (kalendarium + special events + Wykonawcy + recurring
// series cards, per ADC_Program.jpg) is CMS-backed under the `program` pages slug.
// `/program` itself is 301'd to `/events` (next.config.ts), so we render that page's
// layout here — the month-view calendar (EventsCalendarBlock variant 'full') is the
// primary element. SEO metadata still lives on `/events` (eventsListMetadata).
const PROGRAM_SLUG = 'program'

async function getPageBySlug(slug: string, locale: Locale): Promise<Page | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
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

// Optional SEO `meta` override lives in a `pages` row with slug `events-listing`.
// Tolerate a missing row — metadata falls back to the audit defaults.
async function getSeoOverridePage(locale: Locale): Promise<Page | null> {
  return getPageBySlug('events-listing', locale)
}

export async function renderEventsList(pageParam: string | undefined, locale: Locale) {
  void pageParam // calendar view is not paginated

  const cachedGetProgram = unstable_cache(
    () => getPageBySlug(PROGRAM_SLUG, locale),
    [`page-${PROGRAM_SLUG}-${locale}`],
    { tags: [`page-${PROGRAM_SLUG}`, 'pages', 'events'] },
  )

  const program = await cachedGetProgram()

  // No CMS page (e.g. fresh DB before seed) — redirect up rather than 404.
  if (!program?.layout || program.layout.length === 0) {
    redirect(localeHref(locale, '/'))
  }

  // Expose exactly one H1 = the audit phrase (sr-only), and demote the visible
  // hero heading to <h2> so the design (PageHeroBlock) is preserved 1:1.
  const audit = auditEntry('events', locale)

  return (
    <>
      <h1 className="sr-only">{audit.h1}</h1>
      <BlockRenderer blocks={program.layout} locale={locale} demoteHeroHeading />
    </>
  )
}

export async function eventsListMetadata(locale: Locale) {
  const override = await getSeoOverridePage(locale)
  const audit = auditEntry('events', locale)

  // CMS `events-listing` page `meta` (if present) overrides the audit defaults.
  return buildMetadata({
    locale,
    path: 'events',
    title: override?.meta?.title ?? audit.title,
    description: override?.meta?.description ?? audit.description,
    keywords: audit.keywords,
  })
}
