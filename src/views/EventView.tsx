import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Category, Event, Media, Musician } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { brandTitle, brandDescription, buildMetadata } from '@/lib/audit-seo'
import { localeHref } from '@/utilities/href'
import { EventJsonLd } from '@/components/seo/EventJsonLd'
import { ShareBar } from '@/components/ui/ShareBar'
import { AddToCalendar } from '@/components/ui/AddToCalendar'
import { UpcomingEventsCarousel } from '@/components/ui/UpcomingEventsCarousel'
import { ReserveTrigger } from '@/components/reservations/MyRest'
import { warsawParts, getDayAbbr } from '@/lib/recurring-events'

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
      <section className="relative min-h-[78vh] flex flex-col overflow-hidden">
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
        {/* Top darkening for the date/label, bottom gradient for the title block */}
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-brand-navy/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/10" />

        {/* Special event ribbon — anchored to the left edge */}
        {isSpecial && (
          <span className="absolute top-8 md:top-10 left-0 z-20 bg-brand-gold text-brand-navy text-[11px] md:text-xs font-bold uppercase tracking-[0.16em] pl-6 md:pl-10 pr-5 py-2.5 rounded-r-md shadow-lg">
            {locale === 'pl' ? 'Wydarzenie specjalne' : 'Special event'}
          </span>
        )}

        {/* Date & time — top right */}
        {(weekday || dayMonth || time) && (
          <div
            className={`relative z-10 w-full max-w-[1280px] mx-auto px-6 md:px-10 text-right md:pt-14 ${
              isSpecial ? 'pt-24 sm:pt-10' : 'pt-10'
            }`}
          >
            {(weekday || dayMonth) && (
              <p className="text-xl md:text-2xl font-bold leading-tight">
                {weekday && <span className="text-white">{weekday} </span>}
                <span className="text-brand-gold">{dayMonth}</span>
              </p>
            )}
            {time && (
              <p className="mt-1 flex items-center justify-end gap-2 text-white/80 text-sm md:text-base">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {time}
              </p>
            )}
          </div>
        )}

        {/* Title block — bottom, two columns */}
        <div className="relative z-10 mt-auto w-full max-w-[1280px] mx-auto px-6 md:px-10 pb-12 md:pb-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              {genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {genres.map((g) => (
                    <span
                      key={g.id}
                      className="inline-block border border-white/70 text-white text-[10px] font-bold uppercase tracking-[0.14em] px-3.5 py-1.5 rounded-full"
                    >
                      {g.title}
                    </span>
                  ))}
                </div>
              )}

              {event.leadTitle && (
                <p className="text-white/90 text-base md:text-lg mb-2">{event.leadTitle}</p>
              )}

              <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight">
                {event.title}
              </h1>
            </div>

            <div className="flex flex-col items-start gap-4 lg:items-end shrink-0">
              {event.price != null && (
                <span className="flex items-center gap-2 text-2xl font-bold text-white">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
                    <path d="M9 7v10" strokeDasharray="2 2" />
                  </svg>
                  {event.price} PLN
                </span>
              )}
              <div className="flex flex-wrap items-center gap-3">
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
          </div>
        </div>
      </section>

      {/* Description band */}
      {(event.descriptionHeading || event.body || performers.length > 0) && (
        <section className="py-14 md:py-20 bg-brand-navy-royal border-t-2 border-brand-gold">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            {(event.descriptionHeading || event.shareEnabled) && (
              <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-start md:justify-between">
                {event.descriptionHeading ? (
                  <h2 className="font-serif text-3xl md:text-4xl font-bold">
                    {event.descriptionHeading}
                  </h2>
                ) : (
                  <span />
                )}
                {event.shareEnabled && (
                  <div className="shrink-0 md:pt-2">
                    <ShareBar
                      label={event.shareLabel || (locale === 'pl' ? 'Udostępnij to wydarzenie' : 'Share this event')}
                    />
                  </div>
                )}
              </div>
            )}
            {event.body && (
              <div className="prose prose-invert max-w-[860px] text-white/85">
                <RichTextRenderer content={event.body} />
              </div>
            )}

            {/* Performers — same navy band, directly under the body, no heading (per design) */}
            {performers.length > 0 && (
              <div className="flex flex-wrap gap-x-10 gap-y-6 mt-12">
                {performers.map((p, i) => {
                  const musician = p.musician as Musician
                  const photo = isMedia(musician.photo) ? musician.photo : null
                  return (
                    <div key={p.id ?? i} className="flex items-center gap-4 text-left">
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-brand-navy ring-2 ring-brand-gold">
                        {photo?.url ? (
                          <Image
                            src={photo.url}
                            alt={photo.alt || musician.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-brand-gold text-xl font-serif">
                            {musician.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm uppercase tracking-wide leading-tight">
                          {musician.name}
                        </p>
                        {(p.instrument || musician.instrument) && (
                          <p className="text-brand-gold text-sm mt-0.5">
                            {p.instrument || musician.instrument}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Upcoming events strip — light background with date-badge cards (per design) */}
      {event.showUpcoming !== false && upcoming.length > 0 && (
        <section
          className="py-14 md:py-16 bg-[#F4F1EA]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(17,13,53,0.08) 0, rgba(17,13,53,0.08) 1px, transparent 1px, transparent 11px)',
          }}
        >
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <div className="flex items-center justify-between gap-4 mb-8">
              <h2 className="flex items-center gap-2 font-serif text-2xl md:text-4xl font-bold uppercase text-brand-navy">
                {event.upcomingHeading || (locale === 'pl' ? 'Nadchodzące wydarzenia' : 'Upcoming events')}
                <svg className="w-6 h-6 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </h2>
              <span className="hidden sm:block shrink-0">
                <ReserveTrigger
                  date={event.date}
                  className="inline-flex items-center gap-2 bg-brand-navy text-white text-sm font-bold uppercase tracking-[0.12em] px-7 py-3 rounded-full hover:bg-brand-navy/85 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-2-3.46V6h16v2.54z" />
                  </svg>
                  {ctaLabel}
                </ReserveTrigger>
              </span>
            </div>
            <UpcomingEventsCarousel
              cards={upcoming.map((ev) => {
                const img = isMedia(ev.image) ? ev.image : isMedia(ev.posterImage) ? ev.posterImage : null
                const evDate = ev.date ? new Date(ev.date) : null
                return {
                  id: ev.id,
                  href: localeHref(locale, `/events/${ev.slug}`),
                  title: ev.title ?? '',
                  dayAbbr: evDate ? getDayAbbr(evDate, locale) : '',
                  dayNum: evDate ? String(warsawParts(evDate).day).padStart(2, '0') : '',
                  isSpecial: ev.eventType === 'special',
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
