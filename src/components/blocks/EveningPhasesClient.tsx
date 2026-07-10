'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ReserveTrigger } from '@/components/reservations/MyRest'

export type DayPill = {
  key: string
  label: string
  hours: string
  hasEvent: boolean
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
      {body && <p className="text-white/70 text-sm md:text-base leading-relaxed">{body}</p>}
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

export function EveningPhasesClient({
  heading,
  days,
  defaultDay,
  phases,
  eventsByDay,
  reserveLabel,
  locale,
}: {
  heading: string
  days: DayPill[]
  defaultDay: string
  phases: PhaseData[]
  eventsByDay: Record<string, DayEvent>
  reserveLabel: string
  locale: string
}) {
  const [selected, setSelected] = useState(defaultDay)
  const detailsLabel = locale === 'pl' ? 'Szczegóły' : 'Details'
  const selectedEvent = eventsByDay[selected] ?? null

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {heading && (
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-white font-serif text-3xl md:text-4xl font-bold uppercase tracking-tight">
              {heading}
            </h2>
            <span className="text-brand-gold text-2xl md:text-3xl font-bold">›</span>
          </div>
        )}

        {/* Clickable weekday tabs (hours from the OpeningHours global). */}
        {days.length > 0 && (
          <div
            role="tablist"
            aria-label={locale === 'pl' ? 'Wybierz dzień' : 'Choose a day'}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10"
          >
            {days.map((d) => {
              const active = d.key === selected
              return (
                <button
                  key={d.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelected(d.key)}
                  className={`rounded-full px-4 py-3 text-center transition-colors cursor-pointer ${
                    active
                      ? 'bg-white text-brand-navy'
                      : 'border border-white/30 text-white hover:border-white/70'
                  }`}
                >
                  <div className="text-[12px] font-bold uppercase tracking-[0.1em]">{d.label}</div>
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
