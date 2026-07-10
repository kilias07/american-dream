import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Media, Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { BlockRenderer } from '@/components/BlockRenderer'
import { AgeGate } from '@/components/AgeGate'
import { getUILabels } from '@/lib/ui-labels'
import { buildMetadata, brandTitle, getAuditEntry } from '@/lib/audit-seo'
import { localeHref } from '@/utilities/href'

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

async function getPage(slug: string, locale: Locale): Promise<Page | null> {
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
    // Transient D1 error / bad locale -> graceful 404 instead of a 500.
    return null
  }
}

export async function renderPage(slug: string, locale: Locale) {
  const cachedGetPage = unstable_cache(
    () => getPage(slug, locale),
    [`page-${slug}-${locale}`],
    { tags: [`page-${slug}`, 'pages'] },
  )

  const page = await cachedGetPage()

  if (!page) {
    // Audit: no 404 — redirect up to the home page.
    redirect(localeHref(locale, '/'))
  }

  // Audit pages (restaurant / bar-and-cocktails / cigar-lounge) carry a defined
  // H1. Emit it as an sr-only <h1> and demote the hero heading to <h2> so the
  // visual design is preserved while the page exposes exactly one (audit) <h1>.
  const audit = getAuditEntry(slug, locale)

  // Bramka wiekowa 18+ (uwaga klienta 2026-07) — tylko na stronach z checkboxem.
  const ageGateLabels = page.requireAgeGate ? (await getUILabels(locale))?.ageGate : null

  return (
    <>
      {audit && <h1 className="sr-only">{audit.h1}</h1>}
      {page.requireAgeGate && (
        <AgeGate labels={ageGateLabels} locale={locale} homeHref={localeHref(locale, '/')} />
      )}
      <BlockRenderer blocks={page.layout} locale={locale} demoteHeroHeading={Boolean(audit)} />
    </>
  )
}

export async function pageStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })

    const pages = await payload.find({
      collection: 'pages',
      draft: false,
      overrideAccess: false,
      pagination: false,
      select: { slug: true },
    })

    return pages.docs
      .filter((page) => page.slug && page.slug !== 'home')
      .map((page) => ({ slug: page.slug as string }))
  } catch {
    // DB not ready yet (e.g. migration not applied) — pages will be rendered on demand
    return []
  }
}

export async function pageMetadata(slug: string, locale: Locale) {
  const page = await getPage(slug, locale)

  if (!page) return {}

  const { meta } = page
  const ogImage = isMedia(meta?.image) ? meta.image : null

  // Known audit pages (restaurant / bar-and-cocktails / cigar-lounge) get the
  // audit's title/description/keywords; any other CMS page falls back to
  // "{Page Title} - American Dream Club" (audit §"pozostałe podstrony").
  // CMS `meta` still overrides everything.
  const audit = getAuditEntry(slug, locale)

  return buildMetadata({
    locale,
    path: slug,
    title: meta?.title ?? audit?.title ?? brandTitle(page.title),
    description: meta?.description ?? audit?.description,
    keywords: audit?.keywords,
    ogImageUrl: ogImage?.url ?? null,
  })
}
