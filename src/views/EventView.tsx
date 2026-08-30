import { getPayload } from 'payload'
import { permanentRedirect } from 'next/navigation'
import Link from 'next/link'
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
import { ReserveTrigger } from '@/components/reservations/MyRest'
import { AddToCalendar } from '@/components/ui/AddToCalendar'
import { EventsTeaserSectionBlock } from '@/components/blocks/EventsTeaserSectionBlock'
import { NewsletterCTASection } from '@/components/blocks/NewsletterCTASection'
import { RecurringSeriesTeaserBlock } from '@/components/blocks/RecurringSeriesTeaserBlock'
import type {
  EventsTeaserBlock as EventsTeaserBlockType,
  NewsletterCtaBlock as NewsletterCTABlockType,
  RecurringSeriesTeaserBlock as RecurringSeriesTeaserBlockType,
} from '@/payload-types'
import { warsawParts } from '@/lib/recurring-events'
import { getSiteContact } from '@/lib/site-contact'
import { getUILabels, pick } from '@/lib/ui-labels'
import { intlLocale, ui as uiText } from '@/config/ui-strings'

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
      where: { slug: { equals: slug }, published: { not_equals: false } },
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

function formatDateParts(value: string | null | undefined, locale: Locale) {
  if (!value) return { weekday: '', dayMonth: '', time: '' }
  const date = new Date(value)
  const intl = intlLocale(locale)
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
    permanentRedirect(localeHref(locale, '/events'))
  }

  // Venue address for the .ics / Google Calendar export (from site-settings).
  const contact = await getSiteContact(locale)
  const ui = await getUILabels(locale)

  const hero = isMedia(event.image) ? event.image : isMedia(event.posterImage) ? event.posterImage : null
  const { weekday, dayMonth, time } = formatDateParts(event.date, locale)
  const genres = (event.genres ?? []).filter(isCategory)
  const performers = (event.performers ?? []).filter((p) => isMusician(p.musician))
  const isSpecial = event.eventType === 'special'

  // Every reservation CTA opens the MyRest widget (the old site's only booking
  // system) — pre-selected to this event's night. We don't push any separate
  // ticket vendor, so the label is always the table-reservation wording.
  const ctaLabel = pick(ui?.event?.reserveTable, uiText(locale).reserveTable)
  const ctaClass =
    'inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-sm font-bold uppercase tracking-[0.12em] px-7 py-3 rounded-full hover:bg-brand-gold-dark transition-colors'

  return (
    <div className="bg-brand-navy text-white">
      <EventJsonLd event={event} locale={locale} />
      {/* Hero — CAŁOŚĆ wydarzenia na zdjęciu, bez przewijania na desktopie
          (uwagi klienta 2026-07, E1/E2): data+godzina POWIĘKSZONE w prawym
          górnym rogu; tagi, tytuł, OPIS, wykonawcy i share osadzone na hero. */}
      {/* Wysokość = viewport MINUS fixed header (uwaga klienta 2026-07: cała
          karta wydarzenia widoczna na jednym ekranie bez przewijania). */}
      <section className="relative min-h-[calc(100svh-var(--header-h,122px))] flex flex-col overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/80 to-brand-navy/15" />

        {/* Special event ribbon — anchored to the left edge */}
        {isSpecial && (
          <span className="absolute top-8 md:top-10 left-0 z-20 bg-brand-gold text-brand-navy text-[11px] md:text-xs font-bold uppercase tracking-[0.16em] pl-6 md:pl-10 pr-5 py-2.5 rounded-r-md shadow-lg">
            {pick(ui?.event?.specialEvent, uiText(locale).specialEvent)}
          </span>
        )}

        {/* Date & time — top right, powiększone (E2: „data i godzina — powiększyć!") */}
        {(weekday || dayMonth || time) && (
          <div
            className={`relative z-10 w-full max-w-[1280px] mx-auto px-6 md:px-10 text-right md:pt-12 ${
              isSpecial ? 'pt-24 sm:pt-10' : 'pt-10'
            }`}
          >
            {(weekday || dayMonth) && (
              <p className="text-3xl md:text-5xl font-bold leading-tight">
                {weekday && <span className="text-white">{weekday} </span>}
                <span className="text-brand-gold">{dayMonth}</span>
              </p>
            )}
            {time && (
              <p className="mt-2 flex items-center justify-end gap-2 text-white/90 text-lg md:text-2xl font-semibold">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {time}
              </p>
            )}
          </div>
        )}

        {/* Blok treści — dół hero, dwie kolumny; opis + wykonawcy + share NA zdjęciu */}
        <div className="relative z-10 mt-auto w-full max-w-[1280px] mx-auto px-6 md:px-10 pb-10 md:pb-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl min-w-0">
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

              <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
                {event.title}
              </h1>

              {/* Opis na hero — przycięty (CSS clamp), pełna treść w SEO/JSON-LD */}
              {event.body && (
                <div className="mt-5 max-w-2xl text-white/85 text-sm md:text-base leading-relaxed line-clamp-4 lg:line-clamp-5 [&_p]:mb-2">
                  <RichTextRenderer content={event.body} locale={locale} />
                </div>
              )}

              {/* Wykonawcy — kompaktowo, na hero */}
              {performers.length > 0 && (
                <div className="flex flex-wrap gap-x-8 gap-y-4 mt-6">
                  {performers.map((p, i) => {
                    const musician = p.musician as Musician
                    const photo = isMedia(musician.photo) ? musician.photo : null
                    return (
                      <div key={p.id ?? i} className="flex items-center gap-3 text-left">
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-brand-navy ring-2 ring-brand-gold">
                          {photo?.url ? (
                            <Image
                              src={photo.url}
                              alt={photo.alt || musician.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-brand-gold text-lg font-serif">
                              {musician.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs uppercase tracking-wide leading-tight">
                            {musician.name}
                          </p>
                          {(p.instrument || musician.instrument) && (
                            <p className="text-brand-gold text-xs mt-0.5">
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

            <div className="flex flex-col items-start gap-4 lg:items-end shrink-0">
              {event.price != null && (
                <span className="flex items-center gap-2 text-2xl md:text-3xl font-bold text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
                    <path d="M9 7v10" strokeDasharray="2 2" />
                  </svg>
                  {event.price} PLN
                </span>
              )}
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                {/* Rezerwacja Z DATĄ wydarzenia — otwiera widget MyRest
                    pre-ustawiony na tę noc (mrOpen({date}), 2026-08-06). */}
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
                      location: `American Dream Club, ${contact.address}`,
                      startISO: event.date,
                      endTime: event.endTime ?? undefined,
                    }}
                  />
                )}
              </div>
              {/* Udostępnij — na hero, pod przyciskami */}
              {event.shareEnabled && (
                <ShareBar
                  label={event.shareLabel || (uiText(locale).shareEvent)}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* E3 (uwaga klienta 2026-07): nadchodzące wydarzenia = komponent z home
          (żółte tło, przewijana karuzela) zamiast osobnej karuzeli. */}
      {event.showUpcoming !== false && (
        <EventsTeaserSectionBlock
          locale={locale}
          excludeId={event.id}
          ignoreHomepageFlag
          block={
            {
              blockType: 'eventsTeaser',
              heading:
                event.upcomingHeading ||
                (uiText(locale).upcomingEventsUpper),
              viewAllLabel: uiText(locale).seeFullProgram,
              viewAllUrl: '/events',
              limit: 30,
            } as EventsTeaserBlockType
          }
        />
      )}

      {/* E4: Newsletter */}
      <NewsletterCTASection
        locale={locale}
        block={
          {
            blockType: 'newsletterCTA',
            heading: 'NEWSLETTER',
            body:
              locale === 'pl'
                ? 'Zapisz się i bądź na bieżąco z programem koncertów.'
                : 'Sign up and stay up to date with the concert programme.',
            placeholder: uiText(locale).emailAddress,
            buttonLabel: uiText(locale).signUpUpper,
            consentText:
              uiText(locale).acceptPrivacyPolicy,
          } as NewsletterCTABlockType
        }
      />

      {/* E5: Wydarzenia cykliczne (blok z pustą listą sam pobiera wszystkie serie) */}
      <RecurringSeriesTeaserBlock
        locale={locale}
        block={
          {
            blockType: 'recurringSeriesTeaser',
            eyebrow: uiText(locale).recurring,
            heading: uiText(locale).recurringEventsUpper,
            series: [],
          } as unknown as RecurringSeriesTeaserBlockType
        }
      />
    </div>
  )
}

export async function eventStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const events = await payload.find({
      collection: 'events',
      where: { published: { not_equals: false } },
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
