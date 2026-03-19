import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import type { Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { BlockRenderer } from '@/components/BlockRenderer'

export const dynamic = 'force-dynamic'

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
  const page = await getHomePage(locale as Locale)

  if (!page) {
    notFound()
  }

  return <BlockRenderer blocks={page.layout} />
}
