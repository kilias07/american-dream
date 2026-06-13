import { getPayload } from 'payload'
import Image from 'next/image'
import Link from 'next/link'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Event, Media, Page } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'
import { auditEntry, buildMetadata } from '@/lib/audit-seo'
import { BlockRenderer } from '@/components/BlockRenderer'
import { warsawParts } from '@/lib/recurring-events'

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

const PAGE_SIZE = 12

async function getEvents(
  locale: Locale,
  page: number,
): Promise<{ docs: Event[]; totalPages: number; page: number }> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'events',
      where: { date: { greater_than_equal: new Date().toISOString() } },
      sort: 'date',
      locale,
      fallbackLocale: defaultLocale,
      depth: 1,
      limit: PAGE_SIZE,
      page,
    })
    return { docs: result.docs as Event[], totalPages: result.totalPages, page: result.page ?? page }
  } catch {
    return { docs: [], totalPages: 0, page }
  }
}

// Optional intro/SEO copy lives in a `pages` row with slug `events-listing`.
// Tolerate a missing row — the listing renders without it.
async function getIntroPage(locale: Locale): Promise<Page | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'events-listing' } },
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

function formatDateLabel(value: string | null | undefined, locale: Locale): string {
  if (!value) return ''
  const p = warsawParts(new Date(value))
  const day = String(p.day).padStart(2, '0')
  const month = String(p.month + 1).padStart(2, '0')
  const time = `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
  void locale
  return `${day}.${month} · ${time}`
}

export async function renderEventsList(pageParam: string | undefined, locale: Locale) {
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const cachedGetEvents = unstable_cache(
    () => getEvents(locale, page),
    [`events-list-${locale}-${page}`],
    { tags: ['events'] },
  )
  const cachedIntro = unstable_cache(() => getIntroPage(locale), [`events-listing-page-${locale}`], {
    tags: ['page-events-listing', 'pages'],
  })

  const [{ docs, totalPages }, intro] = await Promise.all([cachedGetEvents(), cachedIntro()])

  return (
    <div className="bg-brand-navy text-white">
      {/* Page hero */}
      <section className="py-16 md:py-24 text-center bg-brand-navy-royal">
        <div className="max-w-[1280px] mx-auto px-6">
          <p className="text-brand-gold text-sm font-semibold uppercase tracking-[0.2em] mb-3">
            American Dream Club
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold uppercase tracking-tight">
            {auditEntry('events', locale).h1}
          </h1>
        </div>
      </section>

      {/* Optional CMS intro/SEO copy */}
      {intro?.layout && intro.layout.length > 0 && (
        <BlockRenderer blocks={intro.layout} locale={locale} />
      )}

      {/* Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          {docs.length === 0 ? (
            <p className="text-center text-white/60 py-20">
              {locale === 'pl' ? 'Brak nadchodzących wydarzeń.' : 'No upcoming events.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {docs.map((ev) => {
                const img = isMedia(ev.image)
                  ? ev.image
                  : isMedia(ev.posterImage)
                    ? ev.posterImage
                    : null
                const dateLabel = formatDateLabel(ev.date, locale)
                return (
                  <Link
                    key={ev.id}
                    href={localeHref(locale, `/events/${ev.slug}`)}
                    className="group relative rounded-2xl overflow-hidden bg-brand-navy-royal flex flex-col"
                    style={{ minHeight: 360 }}
                  >
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={img.alt || ev.title || ''}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-brand-navy-royal" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/10" />

                    <div className="relative mt-auto p-6">
                      {dateLabel && (
                        <p className="text-brand-gold text-[11px] font-bold uppercase tracking-[0.16em] mb-2">
                          {dateLabel}
                        </p>
                      )}
                      <h2 className="text-white text-lg font-bold uppercase tracking-wide leading-tight mb-2">
                        {ev.title}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-brand-gold text-[11px] font-bold uppercase tracking-[0.14em]">
                        {locale === 'pl' ? 'Zobacz więcej…' : 'See more…'}
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
                  href={n === 1 ? localeHref(locale, '/events') : `${localeHref(locale, '/events')}?page=${n}`}
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

export async function eventsListMetadata(locale: Locale) {
  const intro = await getIntroPage(locale)
  const audit = auditEntry('events', locale)

  // CMS intro page `meta` (if present) overrides the audit defaults.
  return buildMetadata({
    locale,
    path: 'events',
    title: intro?.meta?.title ?? audit.title,
    description: intro?.meta?.description ?? audit.description,
    keywords: audit.keywords,
  })
}
