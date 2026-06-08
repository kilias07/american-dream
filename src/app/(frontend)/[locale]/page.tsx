import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Media, Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { BlockRenderer } from '@/components/BlockRenderer'
import { localizedAlternates } from '@/utilities/seo'
import { RestaurantJsonLd } from '@/components/seo/RestaurantJsonLd'
import { SiteJsonLd } from '@/components/seo/SiteJsonLd'

// Home-page SEO copy. PL matches the previous WordPress/Yoast site verbatim so
// the Google listing and shared-link preview stay identical; EN is a clean
// equivalent (the old EN auto-generated text was low quality). Payload's
// per-page `meta` (editable in admin) overrides these when set.
const HOME_SEO: Record<string, { title: string; description: string; ogTitle: string }> = {
  pl: {
    title: 'Klub muzyczny – Poznań: bogata oferta American Dream Club',
    description:
      'Klub muzyczny American Dream Club w sercu Poznania to wyjątkowe miejsce na organizację różnych imprez. Dołącz do nas i poczuj niesamowitą atmosferę! Zapraszamy!',
    ogTitle: 'Strona główna',
  },
  en: {
    title: 'Music club in Poznań – American Dream Club',
    description:
      'American Dream Club in the heart of Poznań — a music club, restaurant, cocktail bar and cigar lounge in one. Live concerts and a great atmosphere. Welcome!',
    ogTitle: 'Home page',
  },
}

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

export default async function LocaleIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const cachedGetHomePage = unstable_cache(
    () => getHomePage(locale as Locale),
    [`page-home-${locale}`],
    { tags: ['page-home', 'pages'] },
  )

  const page = await cachedGetHomePage()

  if (!page) {
    notFound()
  }

  return (
    <>
      <SiteJsonLd locale={locale} />
      <RestaurantJsonLd />
      <BlockRenderer blocks={page.layout} locale={locale} />
    </>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const page = await getHomePage(locale as Locale)

  const meta = page?.meta
  const ogImage = isMedia(meta?.image) ? meta.image : null
  const fallback = HOME_SEO[locale] ?? HOME_SEO.pl

  const title = meta?.title ?? fallback.title
  const description = meta?.description ?? fallback.description

  return {
    // `absolute` so the brand isn't appended twice — the home title already
    // contains "American Dream Club" (matching the live site exactly).
    title: { absolute: title },
    description,
    alternates: localizedAlternates(locale, ''),
    openGraph: {
      title: meta?.title ?? fallback.ogTitle,
      description,
      // Next replaces (not merges) the parent layout's openGraph when a route
      // sets its own, so re-declare the image: a page-specific OG image if the
      // editor set one in Payload, otherwise the default brand card.
      images: ogImage?.url ? [{ url: ogImage.url }] : ['/og-image.jpg'],
    },
  }
}
