import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { BlockRenderer } from '@/components/BlockRenderer'
import { auditEntry, buildMetadata } from '@/lib/audit-seo'

const PAGE_SLUG = 'pod-papugami'

async function getPodPapugamiPage(locale: Locale): Promise<Page | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'pages',
      where: { slug: { equals: PAGE_SLUG } },
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

function EmptyShell({ title }: { title: string }) {
  return (
    <div className="bg-brand-navy text-white">
      <section className="py-16 md:py-24 text-center bg-brand-navy-royal">
        <div className="max-w-[1280px] mx-auto px-6">
          <p className="text-brand-gold text-sm font-semibold uppercase tracking-[0.2em] mb-3">
            American Dream Club
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold uppercase tracking-tight">
            {title}
          </h1>
        </div>
      </section>
    </div>
  )
}

export async function renderPodPapugami(locale: Locale) {
  const cachedGetPage = unstable_cache(
    () => getPodPapugamiPage(locale),
    [`page-${PAGE_SLUG}-${locale}`],
    { tags: [`page-${PAGE_SLUG}`, 'pages'] },
  )
  const page = await cachedGetPage()

  if (!page || !page.layout || page.layout.length === 0) {
    return <EmptyShell title={page?.title ?? auditEntry('pod-papugami', locale).h1} />
  }

  return <BlockRenderer blocks={page.layout} locale={locale} />
}

export async function podPapugamiMetadata(locale: Locale) {
  const page = await getPodPapugamiPage(locale)
  const audit = auditEntry('pod-papugami', locale)

  // CMS page `meta` overrides the audit defaults.
  return buildMetadata({
    locale,
    path: 'news/pod-papugami',
    title: page?.meta?.title ?? audit.title,
    description: page?.meta?.description ?? audit.description,
    keywords: audit.keywords,
  })
}
