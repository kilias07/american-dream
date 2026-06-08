import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Media, Musician, Event } from '@/payload-types'
import { locales, defaultLocale, type Locale } from '@/config/locales'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { localizedAlternates } from '@/utilities/seo'
import { formatTime, getDayAbbr, warsawDayKey } from '@/lib/recurring-events'

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

async function getMusician(slug: string, locale: Locale): Promise<Musician | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'musicians',
      where: { slug: { equals: slug } },
      locale,
      fallbackLocale: defaultLocale,
      depth: 1,
      limit: 1,
    })
    return (result.docs[0] as Musician) ?? null
  } catch {
    return null
  }
}

// Upcoming events featuring this musician — derives from the Events collection.
async function getUpcomingForMusician(musicianId: number, locale: Locale): Promise<Event[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'events',
      where: {
        and: [
          { date: { greater_than_equal: new Date().toISOString() } },
          { 'performers.musician': { equals: musicianId } },
        ],
      },
      sort: 'date',
      locale,
      fallbackLocale: defaultLocale,
      depth: 1,
      limit: 6,
    })
    return result.docs as Event[]
  } catch {
    return []
  }
}

export default async function MusicianPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params

  const cachedGetMusician = unstable_cache(
    () => getMusician(slug, locale as Locale),
    [`musician-${slug}-${locale}`],
    { tags: [`musician-${slug}`, 'musicians'] },
  )
  const musician = await cachedGetMusician()
  if (!musician) notFound()

  const cachedUpcoming = unstable_cache(
    () => getUpcomingForMusician(musician.id, locale as Locale),
    [`musician-events-${musician.id}-${locale}`],
    { tags: ['events'] },
  )
  const upcoming = await cachedUpcoming()

  const hero = isMedia(musician.heroImage)
    ? musician.heroImage
    : isMedia(musician.photo)
      ? musician.photo
      : null

  return (
    <div className="bg-brand-navy text-white">
      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-end overflow-hidden">
        {hero?.url ? (
          <Image
            src={hero.url}
            alt={hero.alt || musician.name}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-navy-royal" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/20" />

        <div className="relative w-full max-w-[1000px] mx-auto px-6 md:px-10 pb-12 md:pb-16">
          <Link
            href={`/${locale}/program`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-brand-gold text-[11px] font-bold uppercase tracking-[0.14em] mb-5 transition-colors"
          >
            <span aria-hidden>‹</span>
            {locale === 'pl' ? 'Nasi muzycy' : 'Our musicians'}
          </Link>

          {(musician.role || musician.instrument) && (
            <p className="text-brand-gold text-sm font-semibold uppercase tracking-[0.18em] mb-2">
              {musician.role || musician.instrument}
            </p>
          )}
          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight">{musician.name}</h1>
          {musician.role && musician.instrument && (
            <p className="text-white/70 text-sm uppercase tracking-[0.12em] mt-3">{musician.instrument}</p>
          )}
        </div>
      </section>

      {/* Bio */}
      {(musician.bio || musician.body) && (
        <section className="py-14 md:py-20 bg-brand-navy-royal">
          <div className="max-w-[760px] mx-auto px-6 md:px-10">
            {musician.bio && (
              <p className="text-white/90 text-lg md:text-xl leading-relaxed mb-8 font-light">
                {musician.bio}
              </p>
            )}
            {musician.body && (
              <div className="prose prose-invert max-w-none text-white/85">
                <RichTextRenderer content={musician.body} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Upcoming events with this musician */}
      {upcoming.length > 0 && (
        <section className="py-14 md:py-16">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 uppercase">
              {locale === 'pl' ? 'Najbliższe występy' : 'Upcoming performances'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {upcoming.map((ev) => {
                const img = isMedia(ev.image) ? ev.image : isMedia(ev.posterImage) ? ev.posterImage : null
                const dayAbbr = ev.date ? getDayAbbr(new Date(ev.date), locale) : ''
                const dayNum = ev.date ? warsawDayKey(ev.date).slice(-2) : ''
                const time = formatTime(ev.date)
                return (
                  <Link
                    key={ev.id}
                    href={`/${locale}/program/${ev.id}`}
                    className="group relative rounded-xl overflow-hidden bg-brand-navy"
                    style={{ minHeight: 200 }}
                  >
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={img.alt || ev.title || ''}
                        fill
                        className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 16vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-brand-navy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/50 to-transparent" />
                    {ev.date && (
                      <div className="absolute top-2 left-2 bg-brand-gold text-brand-navy text-center rounded-md px-2 py-1 leading-none z-10">
                        <div className="text-[9px] font-bold uppercase tracking-wider">{dayAbbr}</div>
                        <div className="text-[16px] font-bold leading-none">{dayNum}</div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white text-[12px] font-bold uppercase leading-tight">{ev.title}</h3>
                      {time && <p className="text-white/70 text-[10px] mt-0.5">{time}</p>}
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

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const musicians = await payload.find({
      collection: 'musicians',
      pagination: false,
      select: { slug: true },
    })
    return musicians.docs
      .filter((m) => m.slug)
      .flatMap((m) => locales.map((locale) => ({ locale, slug: m.slug as string })))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const musician = await getMusician(slug, locale as Locale)
  if (!musician) return {}

  const ogImage = isMedia(musician.heroImage)
    ? musician.heroImage
    : isMedia(musician.photo)
      ? musician.photo
      : null

  return {
    title: musician.name,
    description: musician.bio ?? undefined,
    alternates: localizedAlternates(locale, `muzycy/${slug}`),
    openGraph: {
      type: 'profile',
      title: musician.name,
      description: musician.bio ?? undefined,
      ...(ogImage?.url ? { images: [{ url: ogImage.url }] } : {}),
    },
  }
}
