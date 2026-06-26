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
  secondaryCtaLabel: string | null
  secondaryCtaUrl: string | null
  linkToCalendar: boolean
}

const cardWrap =
  'flex flex-col md:flex-row items-stretch gap-6 md:gap-10 bg-brand-navy-royal rounded-2xl overflow-hidden'
const imgWrap =
  'relative w-full md:w-2/5 aspect-[4/3] md:aspect-auto md:min-h-[280px] flex-shrink-0'
const primaryBtn =
  'inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors'
const secondaryBtn =
  'inline-flex items-center gap-2 border border-white text-white text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-white hover:text-brand-navy transition-colors'

function CardImage({ url, alt }: { url: string | null; alt: string }) {
  return (
    <div className={imgWrap}>
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 40vw"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy" />
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
      <div className="flex-1 flex flex-col justify-center p-6 md:py-10 md:pr-10">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wide">
            {event.title}
          </h3>
          {event.timeLabel && (
            <span className="inline-block bg-brand-navy text-white text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full">
              {event.timeLabel}
            </span>
          )}
          {typeof event.price === 'number' && (
            <span className="inline-block bg-brand-gold text-brand-navy text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full">
              {event.price} zł
            </span>
          )}
        </div>

        {(event.description || phase.body) && (
          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-5">
            {event.description || phase.body}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <ReserveTrigger date={event.dateISO} className={primaryBtn}>
            {phase.primaryCtaLabel || reserveLabel}
          </ReserveTrigger>
          {event.detailsUrl && (
            <Link href={event.detailsUrl} className={secondaryBtn}>
              {phase.secondaryCtaLabel || detailsLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/** A generic (static) phase card — unchanged from the original design. */
function PhaseCard({ phase }: { phase: PhaseData }) {
  return (
    <div className={cardWrap}>
      <CardImage url={phase.imageUrl} alt={phase.imageAlt} />
      <div className="flex-1 flex flex-col justify-center p-6 md:py-10 md:pr-10">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {phase.title && (
            <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wide">
              {phase.title}
            </h3>
          )}
          {phase.timeLabel && (
            <span className="inline-block bg-brand-navy text-white text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full">
              {phase.timeLabel}
            </span>
          )}
        </div>

        {phase.body && (
          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-5">{phase.body}</p>
        )}

        <div className="flex flex-wrap gap-3">
          {phase.primaryCtaEnabled && (
            <ReserveTrigger className={primaryBtn}>
              {phase.primaryCtaLabel}
            </ReserveTrigger>
          )}
          {phase.secondaryCtaLabel && phase.secondaryCtaUrl && (
            <Link href={phase.secondaryCtaUrl} className={secondaryBtn}>
              {phase.secondaryCtaLabel}
            </Link>
          )}
        </div>
      </div>
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
