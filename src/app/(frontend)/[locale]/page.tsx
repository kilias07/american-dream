import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Media, Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { BlockRenderer } from '@/components/BlockRenderer'
import { localizedAlternates } from '@/utilities/seo'
import { RestaurantJsonLd } from '@/components/seo/RestaurantJsonLd'

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

  return {
    title: meta?.title ?? undefined,
    description: meta?.description ?? undefined,
    alternates: localizedAlternates(locale, ''),
    openGraph: {
      title: meta?.title ?? undefined,
      description: meta?.description ?? undefined,
      ...(ogImage?.url ? { images: [{ url: ogImage.url }] } : {}),
    },
  }
}
