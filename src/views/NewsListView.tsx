import { getPayload } from 'payload'
import Image from 'next/image'
import Link from 'next/link'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Media, Post } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'
import { auditEntry, buildMetadata } from '@/lib/audit-seo'
import { getUILabels, pick } from '@/lib/ui-labels'

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

const PAGE_SIZE = 12

async function getPosts(locale: Locale, page: number): Promise<{ docs: Post[]; totalPages: number; page: number }> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      locale,
      fallbackLocale: defaultLocale,
      depth: 1,
      limit: PAGE_SIZE,
      page,
    })
    return { docs: result.docs as Post[], totalPages: result.totalPages, page: result.page ?? page }
  } catch {
    return { docs: [], totalPages: 0, page }
  }
}

export async function renderNewsList(pageParam: string | undefined, locale: Locale) {
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const cachedGetPosts = unstable_cache(
    () => getPosts(locale, page),
    [`posts-list-${locale}-${page}`],
    { tags: ['posts'] },
  )

  const { docs, totalPages } = await cachedGetPosts()

  const ui = await getUILabels(locale)
  const noNewsLabel = pick(ui?.common?.noNews, locale === 'pl' ? 'Brak aktualności.' : 'No news yet.')
  const readMoreLabel = pick(ui?.common?.readMore, locale === 'pl' ? 'Czytaj więcej…' : 'Read more…')

  return (
    <div className="bg-brand-navy text-white">
      {/* Page hero */}
      <section className="py-16 md:py-24 text-center bg-brand-navy-royal">
        <div className="max-w-[1280px] mx-auto px-6">
          <p className="text-brand-gold text-sm font-semibold uppercase tracking-[0.2em] mb-3">
            American Dream Club
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold uppercase tracking-tight">
            {auditEntry('news', locale).h1}
          </h1>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          {docs.length === 0 ? (
            <p className="text-center text-white/60 py-20">
              {noNewsLabel}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docs.map((post) => {
                const img = isMedia(post.heroImage) ? post.heroImage : null
                return (
                  <Link
                    key={post.id}
                    href={localeHref(locale, `/news/${post.slug}`)}
                    className="group relative rounded-2xl overflow-hidden bg-brand-navy-royal flex flex-col"
                    style={{ minHeight: 360 }}
                  >
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={img.alt || post.title}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-brand-navy-royal" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/10" />

                    <div className="relative mt-auto p-6">
                      <h2 className="text-white text-lg font-bold uppercase tracking-wide leading-tight mb-2">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 text-brand-gold text-[11px] font-bold uppercase tracking-[0.14em]">
                        {readMoreLabel}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={n === 1 ? localeHref(locale, '/news') : `${localeHref(locale, '/news')}?page=${n}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    n === page
                      ? 'bg-brand-gold text-brand-navy'
                      : 'border border-white/30 text-white hover:bg-white/10'
                  }`}
                  aria-current={n === page ? 'page' : undefined}
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </section>
    </div>
  )
}

export async function newsListMetadata(locale: Locale) {
  const audit = auditEntry('news', locale)

  return buildMetadata({
    locale,
    path: 'news',
    title: audit.title,
    description: audit.description,
    keywords: audit.keywords,
  })
}
