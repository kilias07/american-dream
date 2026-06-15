import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Category, Event, Media, Musician } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { brandTitle, brandDescription, buildMetadata } from '@/lib/audit-seo'
import { toTitleCase } from '@/utilities/titleCase'
import { localeHref } from '@/utilities/href'
import { EventJsonLd } from '@/components/seo/EventJsonLd'
import { ShareBar } from '@/components/ui/ShareBar'
import { AddToCalendar } from '@/components/ui/AddToCalendar'
import { UpcomingEventsCarousel } from '@/components/ui/UpcomingEventsCarousel'
import { ReserveTrigger } from '@/components/reservations/MyRest'
import { warsawParts } from '@/lib/recurring-events'

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

function isMusician(value: number | null | Musician | undefined): value is Musician {
  return typeof value === 'object' && value !== null
}

function isCategory(value: number | Category | undefined): value is Category {
  return typeof value === 'object' && value !== null
}

async function getEvent(slug: string, locale: Locale): Promise<Event | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'events',
      where: { slug: { equals: slug } },
      locale,
      fallbackLocale: defaultLocale,
      depth: 2,
      limit: 1,
    })
    return (result.docs[0] as Event) ?? null
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
      limit: 5,
    })
    return result.docs as Event[]
  } catch {
    return []
  }
}

function formatDateParts(value: string | null | undefined, locale: Locale) {
  if (!value) return { weekday: '', dayMonth: '', time: '' }
  const date = new Date(value)
  const intl = locale === 'pl' ? 'pl-PL' : 'en-GB'
  // All parts formatted in the club's timezone (Europe/Warsaw).
  const weekday = date.toLocaleDateString(intl, { weekday: 'long', timeZone: 'Europe/Warsaw' })
  const p = warsawParts(date)
  const day = String(p.day).padStart(2, '0')
  const month = String(p.month + 1).padStart(2, '0')
  const time = `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
  return { weekday, dayMonth: `${day}.${month}`, time }
}

export async function renderEvent(slug: string, locale: Locale) {
  const cachedGetEvent = unstable_cache(() => getEvent(slug, locale), [`event-${slug}-${locale}`], {
    tags: [`event-${slug}`, 'events'],
  })

  const event = await cachedGetEvent()

  if (!event) {
    // Audit: no 404 — redirect up to the events listing.
    redirect(localeHref(locale, '/events'))
  }

  const eventId = String(event.id)
  const cachedUpcoming = unstable_cache(
    () => getUpcomingEvents(eventId, locale),
    [`event-upcoming-${eventId}-${locale}`],
    { tags: ['events'] },
  )
  const upcoming = await cachedUpcoming()

  const hero = isMedia(event.image) ? event.image : isMedia(event.posterImage) ? event.posterImage : null
  const { weekday, dayMonth, time } = formatDateParts(event.date, locale)
  const genres = (event.genres ?? []).filter(isCategory)
  const performers = (event.performers ?? []).filter((p) => isMusician(p.musician))
  const isSpecial = event.eventType === 'special'

  // Every reservation CTA opens the MyRest widget (the old site's only booking
  // system) — pre-selected to this event's night. We don't push any separate
  // ticket vendor, so the label is always the table-reservation wording.
  const ctaLabel = locale === 'pl' ? 'Zarezerwuj stolik' : 'Reserve a table'
  const ctaClass =
    'inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-sm font-bold uppercase tracking-[0.12em] px-7 py-3 rounded-full hover:bg-brand-gold-dark transition-colors'

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
            {toTitleCase(event.title)}
          </h1>

          <div className="flex flex-wrap items-center gap-5">
            {event.price != null && (
              <span className="text-2xl font-bold text-white">{event.price} PLN</span>
            )}
            <ReserveTrigger date={event.date} className={ctaClass}>
              {ctaLabel}
            </ReserveTrigger>
            {event.date && (
              <AddToCalendar
                theme="light"
                locale={locale}
                triggerClassName="text-sm tracking-[0.12em] px-7 py-3"
                event={{
                  id: event.id,
                  title: event.title ?? '',
                  description: event.description ?? undefined,
                  startISO: event.date,
                  endTime: event.endTime ?? undefined,
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Description band */}
      {(event.descriptionHeading || event.body) && (
        <section className="py-14 md:py-20 bg-brand-navy-royal">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <div className="max-w-[860px]">
              {event.descriptionHeading && (
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
                  {event.descriptionHeading}
                </h2>
              )}
              <div className="prose prose-invert max-w-none text-white/85">
                <RichTextRenderer content={event.body} />
              </div>
              {event.shareEnabled && (
                <div className="mt-10 pt-6 border-t border-white/10">
                  <ShareBar
                    label={event.shareLabel || (locale === 'pl' ? 'Udostępnij to wydarzenie' : 'Share this event')}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Performers */}
      {performers.length > 0 && (
        <section className="py-14 md:py-16">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">
              {event.performersHeading || (locale === 'pl' ? 'Wykonawcy' : 'Performers')}
            </h2>
            <div className="flex flex-wrap gap-x-8 gap-y-5">
              {performers.map((p, i) => {
                const musician = p.musician as Musician
                const photo = isMedia(musician.photo) ? musician.photo : null
                return (
                  <div
                    key={p.id ?? i}
                    className="flex items-center gap-4 text-left w-full sm:w-[280px]"
                  >
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-brand-navy-royal">
                      {photo?.url ? (
                        <Image
                          src={photo.url}
                          alt={photo.alt || musician.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-brand-gold text-xl font-serif">
                          {musician.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight">{musician.name}</p>
                      {(p.instrument || musician.instrument) && (
                        <p className="text-white/60 text-xs uppercase tracking-wide mt-0.5">
                          {p.instrument || musician.instrument}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming events strip */}
      {event.showUpcoming !== false && upcoming.length > 0 && (
        <section className="py-14 md:py-16 bg-brand-navy-royal">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 uppercase">
              {event.upcomingHeading || (locale === 'pl' ? 'Nadchodzące wydarzenia' : 'Upcoming events')}
            </h2>
            <UpcomingEventsCarousel
              cards={upcoming.map((ev) => {
                const img = isMedia(ev.image) ? ev.image : isMedia(ev.posterImage) ? ev.posterImage : null
                const d = formatDateParts(ev.date, locale)
                return {
                  id: ev.id,
                  href: localeHref(locale, `/events/${ev.slug}`),
                  title: ev.title ?? '',
                  dateLabel: d.dayMonth ? `${d.dayMonth}${d.time ? ` · ${d.time}` : ''}` : '',
                  image: img?.url ? { url: img.url, alt: img.alt || ev.title || '' } : null,
                }
              })}
            />
          </div>
        </section>
      )}
    </div>
  )
}

export async function eventStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const events = await payload.find({
      collection: 'events',
      pagination: false,
      depth: 0,
      select: { slug: true },
    })
    return events.docs
      .filter((ev) => ev.slug)
      .map((ev) => ({ slug: ev.slug as string }))
  } catch {
    return []
  }
}

export async function eventMetadata(slug: string, locale: Locale) {
  const event = await getEvent(slug, locale)

  if (!event) return {}

  const ogImage = isMedia(event.image)
    ? event.image
    : isMedia(event.posterImage)
      ? event.posterImage
      : null

  return buildMetadata({
    locale,
    path: `events/${event.slug}`,
    title: brandTitle(event.title),
    description: brandDescription(event.description),
    ogImageUrl: ogImage?.url ?? null,
  })
}
