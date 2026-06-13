import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { BlockRenderer } from '@/components/BlockRenderer'
import { auditEntry, buildMetadata } from '@/lib/audit-seo'

const PAGE_SLUG = 'business'

async function getBusinessPage(locale: Locale): Promise<Page | null> {
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

// Structure placeholder: render the CMS `business` page. If the row is missing
// or empty, render a minimal empty shell (do NOT 404) — content is filled later.
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

export async function renderBusinessList(locale: Locale) {
  const cachedGetPage = unstable_cache(() => getBusinessPage(locale), [`page-${PAGE_SLUG}-${locale}`], {
    tags: [`page-${PAGE_SLUG}`, 'pages'],
  })
  const page = await cachedGetPage()

  const audit = auditEntry('business', locale)

  if (!page || !page.layout || page.layout.length === 0) {
    return <EmptyShell title={audit.h1} />
  }

  // Audit H1 as sr-only; hero keeps its visual design but drops to <h2>.
  return (
    <>
      <h1 className="sr-only">{audit.h1}</h1>
      <BlockRenderer blocks={page.layout} locale={locale} demoteHeroHeading />
    </>
  )
}

export async function businessListMetadata(locale: Locale) {
  const page = await getBusinessPage(locale)
  const audit = auditEntry('business', locale)

  // CMS page `meta` overrides the audit defaults.
  return buildMetadata({
    locale,
    path: 'business',
    title: page?.meta?.title ?? audit.title,
    description: page?.meta?.description ?? audit.description,
    keywords: audit.keywords,
  })
}
