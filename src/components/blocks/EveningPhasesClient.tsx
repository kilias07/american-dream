'use client'
import React, { useState } from 'react'
import type { Locale } from '@/config/locales'
import Image from 'next/image'
import Link from 'next/link'
import { ReserveTrigger } from '@/components/reservations/MyRest'
import { fixOrphans } from '@/utilities/typography'
import { ui, intlLocale } from '@/config/ui-strings'
import { addDaysKey } from '@/lib/recurring-events'

/** An open weekday of the club week, with its offset from that week's Tuesday. */
export type Weekday = {
  key: string
  label: string
  hours: string
  offset: number
}

export type DayEvent = {
  slug: string
  title: string
  description: string | null
  timeLabel: string
  imageUrl: string | null
  imageAlt: string
  price: number | null
  eventType: 'standard' | 'special' | null
  detailsUrl: string | null
  dateISO: string
}

export type PhaseData = {
  key: string
  title: string
  timeLabel: string
  body: string
  imageUrl: string | null
  imageAlt: string
  primaryCtaLabel: string | null
  primaryCtaEnabled: boolean
  primaryCtaIcon: 'reserve' | 'ticket' | null
  secondaryCtaLabel: string | null
  secondaryCtaUrl: string | null
  linkToCalendar: boolean
}

const cardWrap =
  'flex flex-col md:flex-row items-stretch gap-5 md:gap-8 rounded-2xl p-4 md:p-5'
// Image is a gold-framed, rounded panel inset from the card edge (per design).
const imgWrap =
  'relative w-full md:w-[42%] aspect-[16/10] md:aspect-auto md:min-h-[230px] flex-shrink-0 rounded-xl overflow-hidden border-2 border-brand-gold'
const timePill =
  'inline-flex items-center bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-full border border-white/15'
const primaryBtn =
  'inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors'
const secondaryBtn =
  'inline-flex items-center gap-2 border border-white text-white text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-white hover:text-brand-navy transition-colors'

function TicketIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0"
      aria-hidden
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 11v2" />
      <path d="M13 17v2" />
    </svg>
  )
}

/** Ikona rezerwacji stolika (sztućce) — odróżnia rezerwację od kupna biletu
 *  (uwaga klienta 2026-07: „zróżnicować ikony: rezerwacja i bilet"). */
function ReserveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden>
      <path d="M7 2v7a2 2 0 0 0 2 2v11h2V11a2 2 0 0 0 2-2V2h-1.5v6H10V2H8.5v6H7V2Zm10 0c-1.7 0-3 2-3 5s1 4 2 4v9h2V2Z" />
    </svg>
  )
}

/** Ikona głównego CTA wg pola `primaryCtaIcon` (default: rezerwacja). */
function PrimaryCtaIcon({ icon }: { icon: 'reserve' | 'ticket' | null }) {
  return icon === 'ticket' ? <TicketIcon /> : <ReserveIcon />
}

function CardImage({ url, alt }: { url: string | null; alt: string }) {
  return (
    <div className={imgWrap}>
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 42vw"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy" />
      )}
    </div>
  )
}

/** Title → controls row (time pill + CTAs) → description — the design layout. */
function CardBody({
  title,
  timeLabel,
  body,
  controls,
}: {
  title: string
  timeLabel: string
  body: string
  controls: React.ReactNode
}) {
  return (
    <div className="flex-1 flex flex-col justify-center md:py-2">
      {title && (
        <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className="flex flex-wrap items-center gap-3 mt-4 mb-5">
        {timeLabel && <span className={timePill}>{timeLabel}</span>}
        {controls}
      </div>
      {body && (
        <p className="text-white/70 text-sm md:text-base leading-relaxed">{fixOrphans(body)}</p>
      )}
    </div>
  )
}

/** The calendar-driven card: shows the real event for the selected weekday. */
function EventCard({
  event,
  phase,
  reserveLabel,
  detailsLabel,
}: {
  event: DayEvent
  phase: PhaseData
  reserveLabel: string
  detailsLabel: string
}) {
  return (
    <div className={cardWrap}>
      <CardImage url={event.imageUrl ?? phase.imageUrl} alt={event.imageAlt} />
      <CardBody
        title={event.title}
        timeLabel={event.timeLabel}
        body={event.description || phase.body}
        controls={
          <>
            <ReserveTrigger date={event.dateISO} className={primaryBtn}>
              <PrimaryCtaIcon icon={phase.primaryCtaIcon} />
              {phase.primaryCtaLabel || reserveLabel}
            </ReserveTrigger>
            {event.detailsUrl && (
              <Link href={event.detailsUrl} className={secondaryBtn}>
                {phase.secondaryCtaLabel || detailsLabel}
              </Link>
            )}
          </>
        }
      />
    </div>
  )
}

/** A generic (static) phase card. */
function PhaseCard({ phase }: { phase: PhaseData }) {
  return (
    <div className={cardWrap}>
      <CardImage url={phase.imageUrl} alt={phase.imageAlt} />
      <CardBody
        title={phase.title}
        timeLabel={phase.timeLabel}
        body={phase.body}
        controls={
          <>
            {phase.primaryCtaEnabled && (
              <ReserveTrigger className={primaryBtn}>
                <PrimaryCtaIcon icon={phase.primaryCtaIcon} />
                {phase.primaryCtaLabel}
              </ReserveTrigger>
            )}
            {phase.secondaryCtaLabel && phase.secondaryCtaUrl && (
              <Link href={phase.secondaryCtaUrl} className={secondaryBtn}>
                {phase.secondaryCtaLabel}
              </Link>
            )}
          </>
        }
      />
    </div>
  )
}

/** "2 wrz" — enough to tell weeks apart without crowding the pill. */
function shortDate(key: string, locale: Locale): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)))
}

function WeekArrow({
  dir,
  disabled,
  onClick,
  label,
}: {
  dir: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white transition-colors enabled:hover:border-white enabled:hover:bg-white/10 enabled:cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
        <path d={dir === 'prev' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
      </svg>
    </button>
  )
}

export function EveningPhasesClient({
  heading,
  weekdays,
  firstWeekStart,
  weeksAhead,
  todayKey,
  phases,
  eventsByDate,
  reserveLabel,
  locale,
}: {
  heading: string
  weekdays: Weekday[]
  /** Tuesday of the first selectable club week (YYYY-MM-DD). */
  firstWeekStart: string
  weeksAhead: number
  todayKey: string
  phases: PhaseData[]
  eventsByDate: Record<string, DayEvent>
  reserveLabel: string
  locale: string
}) {
  const loc = locale as Locale
  const t = ui(loc)
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStart = addDaysKey(firstWeekStart, weekOffset * 7)
  const days = weekdays.map((d) => ({ ...d, date: addDaysKey(weekStart, d.offset) }))

  const [picked, setPicked] = useState<string | null>(null)
  // The selection follows the week rather than being reset alongside it: when
  // the shown week no longer contains the picked day, fall back to today (if it
  // is in view) or the first open day. Deriving it this way means paging cannot
  // leave nothing selected, and the arrows only ever move one piece of state —
  // so two quick clicks advance two weeks instead of one.
  const selected =
    picked && days.some((d) => d.date === picked)
      ? picked
      : (days.find((d) => d.date === todayKey)?.date ?? days[0]?.date ?? '')

  const step = (delta: number) =>
    setWeekOffset((prev) => Math.min(Math.max(prev + delta, 0), weeksAhead - 1))

  const detailsLabel = t.details
  const selectedEvent = eventsByDate[selected] ?? null
  const rangeLabel =
    days.length > 0 ? `${shortDate(days[0].date, loc)} – ${shortDate(days[days.length - 1].date, loc)}` : ''

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {heading && (
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-white text-3xl md:text-4xl font-bold uppercase tracking-tight">
              {heading}
            </h2>
            <span className="text-brand-gold text-2xl md:text-3xl font-bold">›</span>
          </div>
        )}

        {days.length > 0 && (
          <>
            {/* Week navigation. Back is disabled on the first week — there is
                nothing to reserve in the past. */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <WeekArrow
                dir="prev"
                disabled={weekOffset === 0}
                onClick={() => step(-1)}
                label={t.previousWeek}
              />
              <div className="text-center">
                <div className="text-white text-sm md:text-base font-semibold">{rangeLabel}</div>
                {weekOffset === 0 && (
                  <div className="text-brand-gold text-[11px] font-bold uppercase tracking-[0.12em] mt-0.5">
                    {t.thisWeek}
                  </div>
                )}
              </div>
              <WeekArrow
                dir="next"
                disabled={weekOffset >= weeksAhead - 1}
                onClick={() => step(1)}
                label={t.nextWeek}
              />
            </div>

            <div
              role="tablist"
              aria-label={t.chooseDay}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10"
            >
              {days.map((d) => {
                const active = d.date === selected
                const hasEvent = Boolean(eventsByDate[d.date])
                return (
                  <button
                    key={d.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setPicked(d.date)}
                    className={`rounded-full px-4 py-3 text-center transition-colors cursor-pointer ${
                      active
                        ? 'bg-white text-brand-navy'
                        : 'border border-white/30 text-white hover:border-white/70'
                    }`}
                  >
                    <div className="text-[12px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-1.5">
                      {d.label}
                      {/* A dot marks a day with a concert, so guests can see at
                          a glance which evenings are programmed. */}
                      {hasEvent && (
                        <span
                          aria-hidden
                          className={`inline-block h-1.5 w-1.5 rounded-full ${active ? 'bg-brand-navy' : 'bg-brand-gold'}`}
                        />
                      )}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${active ? 'text-brand-navy/60' : 'text-white/60'}`}>
                      {shortDate(d.date, loc)}
                    </div>
                    <div
                      className={`text-[12px] font-semibold mt-1 ${
                        active ? 'text-brand-navy/70' : 'text-brand-gold'
                      }`}
                    >
                      {d.hours}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <div className="flex flex-col gap-6">
          {phases.map((phase) =>
            phase.linkToCalendar && selectedEvent ? (
              <EventCard
                key={phase.key}
                event={selectedEvent}
                phase={phase}
                reserveLabel={reserveLabel}
                detailsLabel={detailsLabel}
              />
            ) : (
              <PhaseCard key={phase.key} phase={phase} />
            ),
          )}
        </div>
      </div>
    </section>
  )
}
