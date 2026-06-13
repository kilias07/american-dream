import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Media, Post, RecurringSery } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { localizedAlternates } from '@/utilities/seo'
import { localeHref } from '@/utilities/href'
import {
  expandEvents,
  formatTime,
  getDayAbbr,
  warsawDayKey,
  type EventDoc,
  type EventOccurrence,
} from '@/lib/recurring-events'

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

const ACCENT: Record<NonNullable<RecurringSery['themeColor']>, string> = {
  amber: '#F8AB00',
  blackwhite: '#FFFFFF',
  sepia: '#C9A66B',
  purple: '#9D6BD8',
}

async function getSeries(slug: string, locale: Locale): Promise<RecurringSery | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'recurring-series',
      where: { slug: { equals: slug } },
      locale,
      fallbackLocale: defaultLocale,
      depth: 2,
      limit: 1,
    })
    return (result.docs[0] as RecurringSery) ?? null
  } catch {
    return null
  }
}

async function getOtherSeries(currentId: number, locale: Locale): Promise<RecurringSery[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'recurring-series',
      where: { id: { not_equals: currentId } },
      locale,
      fallbackLocale: defaultLocale,
      depth: 1,
      limit: 6,
    })
    return result.docs as RecurringSery[]
  } catch {
    return []
  }
}

async function getSeriesOccurrences(
  seriesId: number,
  locale: Locale,
  count: number,
): Promise<EventOccurrence[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'events',
      where: { recurringSeries: { equals: seriesId } },
      locale,
      fallbackLocale: defaultLocale,
      depth: 1,
      limit: 50,
    })
    const now = new Date()
    const end = new Date(now)
    end.setDate(end.getDate() + 120)
    return expandEvents(result.docs as unknown as EventDoc[], now, end).slice(0, Math.max(1, count))
  } catch {
    return []
  }
}

async function getLatestPosts(locale: Locale): Promise<Post[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      locale,
      fallbackLocale: defaultLocale,
      depth: 1,
      limit: 3,
    })
    return result.docs as Post[]
  } catch {
    return []
  }
}

export async function renderRecurringSeries(slug: string, locale: Locale) {
  const cachedGetSeries = unstable_cache(
    () => getSeries(slug, locale),
    [`series-${slug}-${locale}`],
    { tags: [`series-${slug}`, 'recurring-series'] },
  )

  const series = await cachedGetSeries()

  if (!series) {
    // Audit: no 404 — redirect up to the events listing.
    redirect(localeHref(locale, '/events'))
  }

  const cachedOthers = unstable_cache(
    () => getOtherSeries(series.id, locale),
    [`series-others-${series.id}-${locale}`],
    { tags: ['recurring-series'] },
  )
  const others = await cachedOthers()

  const upcomingCount = series.upcomingCount ?? 6
  const cachedOccurrences = unstable_cache(
    () => getSeriesOccurrences(series.id, locale, upcomingCount),
    [`series-occurrences-${series.id}-${locale}-${upcomingCount}`],
    { tags: ['events'] },
  )
  const occurrences = await cachedOccurrences()

  const cachedNews = unstable_cache(
    () => getLatestPosts(locale),
    [`series-news-${locale}`],
    { tags: ['posts'] },
  )
  const news = await cachedNews()

  const accent = ACCENT[series.themeColor ?? 'amber']
  const hero = isMedia(series.heroImage) ? series.heroImage : null
  const wordmark = isMedia(series.wordmarkImage) ? series.wordmarkImage : null
  const gallery = (series.gallery ?? []).filter((g) => isMedia(g.image))

  return (
    <div className="bg-brand-navy text-white">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center text-center overflow-hidden">
        {hero?.url ? (
          <Image
            src={hero.url}
            alt={hero.alt || series.name}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-navy-royal" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/40" />

        <div className="relative w-full max-w-[860px] mx-auto px-6 md:px-10 py-16">
          {series.eyebrow && (
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em] mb-4"
              style={{ color: accent }}
            >
              {series.eyebrow}
            </p>
          )}

          {wordmark?.url ? (
            <div className="relative w-full max-w-md mx-auto h-32 md:h-44 mb-6">
              <Image
                src={wordmark.url}
                alt={wordmark.alt || series.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 90vw, 448px"
              />
            </div>
          ) : (
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6">{series.name}</h1>
          )}

          {series.description && (
            <p className="text-white/85 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              {series.description}
            </p>
          )}
        </div>
      </section>

      {/* Upcoming events in this series */}
      {occurrences.length > 0 && (
        <section className="py-12 md:py-16 bg-brand-gold">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold uppercase text-brand-navy">
                {series.upcomingHeading ||
                  (locale === 'pl' ? 'Nadchodzące wydarzenia w cyklu' : 'Upcoming events in this series')}
              </h2>
              <Link
                href={localeHref(locale, '/events')}
                className="inline-flex items-center gap-2 bg-brand-navy text-white text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-navy-royal transition-colors"
              >
                {series.seeProgrammeLabel || (locale === 'pl' ? 'Zobacz program' : 'See programme')}
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {occurrences.map((occ) => {
                const dayAbbr = getDayAbbr(new Date(occ.dateISO), locale)
                const dayNum = warsawDayKey(occ.dateISO).slice(-2)
                const time = formatTime(occ.dateISO)
                const card = (
                  <div className="relative h-full rounded-xl overflow-hidden bg-brand-navy min-h-[180px] flex flex-col">
                    <div className="absolute top-2 left-2 bg-brand-gold text-brand-navy text-center rounded-md px-2 py-1 leading-none z-10">
                      <div className="text-[9px] font-bold uppercase tracking-wider">{dayAbbr}</div>
                      <div className="text-[18px] font-bold leading-none">{dayNum}</div>
                    </div>
                    <div className="mt-auto p-3">
                      <h3 className="text-white font-bold text-[12px] uppercase leading-tight mb-1">
                        {occ.title}
                      </h3>
                      <p className="text-white/70 text-[10px]">
                        {time}
                        {occ.price != null ? ` · ${occ.price} PLN` : ''}
                      </p>
                    </div>
                  </div>
                )
                return (
                  <Link
                    key={occ.id}
                    href={localeHref(locale, `/events/${occ.eventSlug}`)}
                    className="block"
                  >
                    {card}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map((g, i) => {
                const media = g.image as Media
                return (
                  <div
                    key={g.id ?? i}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-brand-navy-royal"
                  >
                    <Image
                      src={media.url as string}
                      alt={media.alt || g.caption || series.name}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    {g.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-navy/90 to-transparent p-3">
                        <p className="text-white/85 text-xs">{g.caption}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Other series */}
      {series.showOtherSeries !== false && others.length > 0 && (
        <section className="py-12 md:py-16 bg-brand-navy-royal">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 uppercase">
              {series.otherSeriesHeading ||
                (locale === 'pl' ? 'Pozostałe wydarzenia cykliczne' : 'Other recurring series')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {others.map((s) => {
                const img = isMedia(s.heroImage)
                  ? s.heroImage
                  : isMedia(s.wordmarkImage)
                    ? s.wordmarkImage
                    : null
                const sAccent = ACCENT[s.themeColor ?? 'amber']
                return (
                  <Link
                    key={s.id}
                    href={localeHref(locale, `/wydarzenia-cykliczne/${s.slug}`)}
                    className="group relative rounded-2xl overflow-hidden bg-brand-navy flex flex-col"
                    style={{ minHeight: 280 }}
                  >
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={img.alt || s.name}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-brand-navy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent" />
                    <div className="relative mt-auto p-5">
                      {s.eyebrow && (
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.16em] mb-1"
                          style={{ color: sAccent }}
                        >
                          {s.eyebrow}
                        </p>
                      )}
                      <h3 className="text-white text-lg font-bold uppercase tracking-wide leading-tight">
                        {s.name}
                      </h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* News (Aktualności) */}
      {series.showNews !== false && news.length > 0 && (
        <section className="py-12 md:py-16 bg-brand-navy">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <div className="flex items-center gap-3 mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold uppercase">
                {series.newsHeading || (locale === 'pl' ? 'Aktualności' : 'News')}
              </h2>
              <Link
                href={localeHref(locale, '/news')}
                className="text-brand-gold text-2xl font-bold leading-none"
                aria-label={locale === 'pl' ? 'Wszystkie aktualności' : 'All news'}
              >
                ›
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.map((np) => {
                const img = isMedia(np.heroImage) ? np.heroImage : null
                return (
                  <Link
                    key={np.id}
                    href={localeHref(locale, `/news/${np.slug}`)}
                    className="group relative rounded-2xl overflow-hidden bg-brand-navy-royal flex flex-col"
                    style={{ minHeight: 260 }}
                  >
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={img.alt || np.title}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-brand-navy-royal" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent" />
                    <div className="relative mt-auto p-5">
                      <h3 className="text-white text-base font-bold uppercase tracking-wide leading-tight mb-1">
                        {np.title}
                      </h3>
                      {np.excerpt && (
                        <p className="text-white/70 text-sm leading-relaxed line-clamp-2">
                          {np.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export async function recurringSeriesStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const series = await payload.find({
      collection: 'recurring-series',
      pagination: false,
      select: { slug: true },
    })
    return series.docs
      .filter((s) => s.slug)
      .map((s) => ({ slug: s.slug as string }))
  } catch {
    return []
  }
}

export async function recurringSeriesMetadata(slug: string, locale: Locale) {
  const series = await getSeries(slug, locale)

  if (!series) return {}

  const ogImage = isMedia(series.heroImage)
    ? series.heroImage
    : isMedia(series.wordmarkImage)
      ? series.wordmarkImage
      : null

  return {
    title: series.name,
    description: series.description ?? undefined,
    alternates: localizedAlternates(locale, `wydarzenia-cykliczne/${slug}`),
    openGraph: {
      title: series.name ?? undefined,
      description: series.description ?? undefined,
      ...(ogImage?.url ? { images: [{ url: ogImage.url }] } : {}),
    },
  }
}
