import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Category, Event, Media, Musician } from '@/payload-types'
import { locales, defaultLocale, type Locale } from '@/config/locales'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { localizedAlternates } from '@/utilities/seo'
import { EventJsonLd } from '@/components/seo/EventJsonLd'

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

function isMusician(value: number | null | Musician | undefined): value is Musician {
  return typeof value === 'object' && value !== null
}

function isCategory(value: number | Category | undefined): value is Category {
  return typeof value === 'object' && value !== null
}

async function getEvent(id: string, locale: Locale): Promise<Event | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const event = await payload.findByID({
      collection: 'events',
      id,
      locale,
      fallbackLocale: defaultLocale,
      depth: 2,
    })
    return (event as Event) ?? null
  } catch {
    return null
  }
}

async function getUpcomingEvents(currentId: string, locale: Locale): Promise<Event[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'events',
      where: {
        and: [{ date: { greater_than_equal: new Date().toISOString() } }, { id: { not_equals: currentId } }],
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

function formatDateParts(value: string | null | undefined, locale: string) {
  if (!value) return { weekday: '', dayMonth: '', time: '' }
  const date = new Date(value)
  const intl = locale === 'pl' ? 'pl-PL' : 'en-GB'
  const weekday = date.toLocaleDateString(intl, { weekday: 'long' })
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const time = date.toLocaleTimeString(intl, { hour: '2-digit', minute: '2-digit', hour12: false })
  return { weekday, dayMonth: `${day}.${month}`, time }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params

  const cachedGetEvent = unstable_cache(() => getEvent(id, locale as Locale), [`event-${id}-${locale}`], {
    tags: [`event-${id}`, 'events'],
  })

  const event = await cachedGetEvent()

  if (!event) {
    notFound()
  }

  const cachedUpcoming = unstable_cache(
    () => getUpcomingEvents(id, locale as Locale),
    [`event-upcoming-${id}-${locale}`],
    { tags: ['events'] },
  )
  const upcoming = await cachedUpcoming()

  const hero = isMedia(event.image) ? event.image : isMedia(event.posterImage) ? event.posterImage : null
  const { weekday, dayMonth, time } = formatDateParts(event.date, locale)
  const genres = (event.genres ?? []).filter(isCategory)
  const performers = (event.performers ?? []).filter((p) => isMusician(p.musician))
  const reserveUrl = event.reservationUrl || event.ticketUrl || '#'
  const isSpecial = event.eventType === 'special'

  return (
    <div className="bg-brand-navy text-white">
      <EventJsonLd event={event} locale={locale} />
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        {hero?.url ? (
          <Image
            src={hero.url}
            alt={hero.alt || event.title || ''}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-navy-royal" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/20" />

        <div className="relative w-full max-w-[1280px] mx-auto px-6 md:px-10 pb-12 md:pb-16">
          {isSpecial && (
            <span className="inline-block bg-brand-gold text-brand-navy text-[11px] font-bold uppercase tracking-[0.16em] px-4 py-1.5 rounded-full mb-5">
              {locale === 'pl' ? 'Wydarzenie specjalne' : 'Special event'}
            </span>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-white/85 text-sm">
            {(weekday || dayMonth) && (
              <span className="font-semibold uppercase tracking-wide">
                {weekday}
                {weekday && dayMonth ? ', ' : ''}
                {dayMonth}
              </span>
            )}
            {time && <span className="text-white/70">{time}</span>}
            {genres.map((g) => (
              <span
                key={g.id}
                className="inline-block border border-brand-gold/60 text-brand-gold text-[10px] font-bold uppercase tracking-[0.14em] px-3 py-1 rounded-full"
              >
                {g.title}
              </span>
            ))}
          </div>

          {event.leadTitle && (
            <p className="text-brand-gold text-sm font-semibold uppercase tracking-[0.18em] mb-2">
              {event.leadTitle}
            </p>
          )}

          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-4xl">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-5">
            {event.price != null && (
              <span className="text-2xl font-bold text-white">{event.price} PLN</span>
            )}
            <Link
              href={reserveUrl}
              target={reserveUrl.startsWith('http') ? '_blank' : undefined}
              rel={reserveUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-sm font-bold uppercase tracking-[0.12em] px-7 py-3 rounded-full hover:bg-brand-gold-dark transition-colors"
            >
              {locale === 'pl' ? 'Zarezerwuj stolik' : 'Reserve a table'}
            </Link>
          </div>
        </div>
      </section>

      {/* Description band */}
      {(event.descriptionHeading || event.body) && (
        <section className="py-14 md:py-20 bg-brand-navy-royal">
          <div className="max-w-[860px] mx-auto px-6 md:px-10">
            {event.descriptionHeading && (
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                {event.descriptionHeading}
              </h2>
            )}
            <div className="prose prose-invert max-w-none text-white/85">
              <RichTextRenderer content={event.body} />
            </div>
          </div>
        </section>
      )}

      {/* Performers */}
      {performers.length > 0 && (
        <section className="py-14 md:py-16">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">
              {locale === 'pl' ? 'Wykonawcy' : 'Performers'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {performers.map((p, i) => {
                const musician = p.musician as Musician
                const photo = isMedia(musician.photo) ? musician.photo : null
                return (
                  <div key={p.id ?? i} className="flex flex-col items-center text-center">
                    <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-brand-navy-royal mb-3">
                      {photo?.url ? (
                        <Image
                          src={photo.url}
                          alt={photo.alt || musician.name}
                          fill
                          className="object-cover"
                          sizes="112px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-brand-gold text-2xl font-serif">
                          {musician.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-sm">{musician.name}</p>
                    {(p.instrument || musician.instrument) && (
                      <p className="text-white/60 text-xs uppercase tracking-wide mt-0.5">
                        {p.instrument || musician.instrument}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming events strip */}
      {upcoming.length > 0 && (
        <section className="py-14 md:py-16 bg-brand-navy-royal">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 uppercase">
              {locale === 'pl' ? 'Nadchodzące wydarzenia' : 'Upcoming events'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {upcoming.map((ev) => {
                const img = isMedia(ev.image) ? ev.image : isMedia(ev.posterImage) ? ev.posterImage : null
                const d = formatDateParts(ev.date, locale)
                return (
                  <Link
                    key={ev.id}
                    href={`/${locale}/program/${ev.id}`}
                    className="group relative rounded-xl overflow-hidden bg-brand-navy"
                    style={{ minHeight: 220 }}
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
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {(d.weekday || d.dayMonth) && (
                        <p className="text-brand-gold text-[10px] font-bold uppercase tracking-wide mb-1">
                          {d.dayMonth}
                          {d.time ? ` · ${d.time}` : ''}
                        </p>
                      )}
                      <h3 className="text-white text-[12px] font-bold uppercase leading-tight">
                        {ev.title}
                      </h3>
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
    const events = await payload.find({
      collection: 'events',
      pagination: false,
      depth: 0,
    })
    return events.docs.flatMap((ev) =>
      locales.map((locale) => ({ locale, id: String(ev.id) })),
    )
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const event = await getEvent(id, locale as Locale)

  if (!event) return {}

  const ogImage = isMedia(event.image)
    ? event.image
    : isMedia(event.posterImage)
      ? event.posterImage
      : null

  return {
    title: event.title ?? 'Wydarzenie',
    description: event.description ?? undefined,
    alternates: localizedAlternates(locale, `program/${id}`),
    openGraph: {
      type: 'article',
      title: event.title ?? undefined,
      description: event.description ?? undefined,
      ...(ogImage?.url ? { images: [{ url: ogImage.url }] } : {}),
    },
  }
}
