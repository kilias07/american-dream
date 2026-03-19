import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { BlockRenderer } from '@/components/BlockRenderer'

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

  return <BlockRenderer blocks={page.layout} />
}
