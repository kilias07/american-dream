import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Media, Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { BlockRenderer } from '@/components/BlockRenderer'
import { auditEntry, buildMetadata } from '@/lib/audit-seo'
import { RestaurantJsonLd } from '@/components/seo/RestaurantJsonLd'
import { SiteJsonLd } from '@/components/seo/SiteJsonLd'

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

// ISR: cache the rendered HTML until revalidateTag('page-home') or 'pages' is called.
// Using revalidate as a safety net in case tag invalidation fails.
export const revalidate = 3600

async function getHomePage(locale: Locale): Promise<Page | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
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

export async function renderHome(locale: Locale) {
  const cachedGetHomePage = unstable_cache(
    () => getHomePage(locale),
    [`page-home-${locale}`],
    { tags: ['page-home', 'pages'] },
  )

  const page = await cachedGetHomePage()

  // Home should always exist; if the CMS is briefly unavailable, render the
  // structured data only — never 404 (audit: no 404; it would also loop with
  // the redirect-up not-found which sends `/` back to `/`).
  // SEO H1 (audit) kept in the DOM for crawlers/AT; the hero keeps its visual
  // design but drops to <h2> so the page has exactly one <h1>.
  const audit = auditEntry('home', locale)

  return (
    <>
      <SiteJsonLd locale={locale} />
      <RestaurantJsonLd />
      <h1 className="sr-only">{audit.h1}</h1>
      {page && <BlockRenderer blocks={page.layout} locale={locale} demoteHeroHeading />}
    </>
  )
}

export async function homeMetadata(locale: Locale) {
  const page = await getHomePage(locale)

  const meta = page?.meta
  const ogImage = isMedia(meta?.image) ? meta.image : null
  const audit = auditEntry('home', locale)

  // CMS `meta` (editable in admin, future GSC-driven) overrides the audit
  // defaults; buildMetadata enforces Title Case + the "- American Dream Club"
  // format and emits keywords/canonical/hreflang/openGraph.
  return buildMetadata({
    locale,
    path: '',
    title: meta?.title ?? audit.title,
    description: meta?.description ?? audit.description,
    keywords: audit.keywords,
    ogImageUrl: ogImage?.url ?? null,
  })
}
