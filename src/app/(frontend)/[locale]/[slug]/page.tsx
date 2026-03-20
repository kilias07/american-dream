import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Media, Page } from '@/payload-types'
import { locales, defaultLocale, type Locale } from '@/config/locales'
import { BlockRenderer } from '@/components/BlockRenderer'

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

async function getPage(slug: string, locale: Locale): Promise<Page | null> {
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
}

export default async function PageRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params

  const cachedGetPage = unstable_cache(
    () => getPage(slug, locale as Locale),
    [`page-${slug}-${locale}`],
    { tags: [`page-${slug}`, 'pages'] },
  )

  const page = await cachedGetPage()

  if (!page) {
    notFound()
  }

  return <BlockRenderer blocks={page.layout} locale={locale} />
}

export async function generateStaticParams() {
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
      .flatMap((page) =>
        locales.map((locale) => ({ locale, slug: page.slug as string })),
      )
  } catch {
    // DB not ready yet (e.g. migration not applied) — pages will be rendered on demand
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const page = await getPage(slug, locale as Locale)

  if (!page) return {}

  const { meta } = page
  const ogImage = isMedia(meta?.image) ? meta.image : null

  return {
    title: meta?.title ?? page.title,
    description: meta?.description,
    openGraph: ogImage?.url ? { images: [{ url: ogImage.url }] } : undefined,
  }
}
