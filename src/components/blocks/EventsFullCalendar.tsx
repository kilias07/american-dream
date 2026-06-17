'use client'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { EventOccurrence } from '@/lib/recurring-events'
import {
  dayKey,
  formatTime,
  getDayAbbr,
  getMonthName,
  getWeekDays,
  groupByDay,
  warsawDayKey,
} from '@/lib/recurring-events'
import { AddToCalendar } from '@/components/ui/AddToCalendar'
import { ReserveTrigger } from '@/components/reservations/MyRest'
import { isReservationUrl } from '@/lib/reservation-url'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'

type Props = {
  occurrences: EventOccurrence[]
  initialYear: number
  initialMonth: number // 0-indexed
  /** Earliest navigable month as year*12 + month. */
  minMonthAbs: number
  /** Latest navigable month as year*12 + month (current + 3). */
  maxMonthAbs: number
  /** Today's Europe/Warsaw day key (YYYY-MM-DD), from the server. */
  todayKey: string
  heading?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  locale: string
}

type Cell = { date: Date; key: string; inMonth: boolean; isPast: boolean; isToday: boolean }

// The club is closed on Mondays, so the calendar omits them entirely: the grid is
// built Monday-first (column 0 = Monday) and every Monday cell is skipped, leaving
// 6 cells per week (Tue→Sun).
const COLUMNS = 6

function buildCells(year: number, month: number, todayKey: string): Cell[] {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const numWeeks = Math.ceil((startOffset + daysInMonth) / 7)
  const totalCells = numWeeks * 7

  const cells: Cell[] = []
  const cursor = new Date(year, month, 1 - startOffset)
  for (let i = 0; i < totalCells; i++) {
    // i % 7 === 0 is always a Monday in this Monday-first layout — drop it.
    if (i % 7 !== 0) {
      const key = dayKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
      cells.push({
        date: new Date(cursor),
        key,
        inMonth: cursor.getMonth() === month,
        isPast: key < todayKey,
        isToday: key === todayKey,
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return cells
}

/** Add `days` to a YYYY-MM-DD key and return the resulting key (pure calendar math). */
function addDaysKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

const AGENDA_WEEK_STEP = 2 // weeks revealed initially and per "show more" click

function EventCard({
  occ,
  locale,
  onOpen,
}: {
  occ: EventOccurrence
  locale: string
  onOpen: (occ: EventOccurrence, trigger: HTMLElement) => void
}) {
  const dayAbbr = getDayAbbr(new Date(occ.dateISO), locale)
  const dayNum = warsawDayKey(occ.dateISO).slice(-2)
  const startTime = formatTime(occ.dateISO)
  const isSpecial = occ.eventType === 'special'

  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={(e) => onOpen(occ, e.currentTarget)}
      className="relative block w-full h-full rounded-xl overflow-hidden bg-brand-navy group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
      aria-label={`${occ.title}, ${dayAbbr} ${dayNum}, ${startTime}`}
    >
      {occ.image?.url ? (
        <Image
          src={occ.image.url}
          alt={occ.image.alt || occ.title}
          fill
          className="object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-300"
          sizes="(max-width: 768px) 50vw, 14vw"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy/90" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/95 via-brand-navy/50 to-brand-navy/20" />

      {/* Day badge — amber for special events, blue for standard (per design) */}
      <div
        className={`absolute top-2 left-2 text-center rounded-md px-2 py-1 leading-none z-10 ${
          isSpecial ? 'bg-brand-gold text-brand-navy' : 'bg-[#1B6EC2] text-white'
        }`}
      >
        <div className="text-[9px] font-bold uppercase tracking-wider">{dayAbbr}</div>
        <div className="text-[18px] font-bold leading-none">{dayNum}</div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10">
        <h3 className="text-white font-bold text-[11px] uppercase leading-tight mb-1">
          {occ.title} <span className="text-white/60">›</span>
        </h3>
        {startTime && (
          <p className="text-white/70 text-[10px]">
            {startTime}
            {occ.endTime ? ` - ${occ.endTime}` : ''}
          </p>
        )}
        {occ.price != null && <p className="text-white/70 text-[10px]">{occ.price} PLN</p>}
      </div>
    </button>
  )
}

function AgendaItem({
  occ,
  locale,
  onOpen,
}: {
  occ: EventOccurrence
  locale: string
  onOpen: (occ: EventOccurrence, trigger: HTMLElement) => void
}) {
  const dayAbbr = getDayAbbr(new Date(occ.dateISO), locale)
  const dayNum = warsawDayKey(occ.dateISO).slice(-2)
  const startTime = formatTime(occ.dateISO)
  const isSpecial = occ.eventType === 'special'

  return (
    <button
      type="button"
      onClick={(e) => onOpen(occ, e.currentTarget)}
      className="flex items-stretch w-full text-left rounded-xl overflow-hidden bg-white ring-1 ring-brand-navy/10 hover:ring-brand-navy/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
    >
      {/* Date badge */}
      <div
        className={`flex flex-col items-center justify-center w-16 shrink-0 py-3 ${
          isSpecial ? 'bg-brand-gold text-brand-navy' : 'bg-brand-navy text-white'
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider">{dayAbbr}</span>
        <span className="text-2xl font-black leading-none">{dayNum}</span>
      </div>

      {/* Thumb */}
      {occ.image?.url && (
        <div className="relative w-16 shrink-0 bg-brand-navy">
          <Image
            src={occ.image.url}
            alt={occ.image.alt || occ.title}
            fill
            className="object-cover grayscale"
            sizes="64px"
          />
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-w-0 px-3 py-2.5">
        {occ.leadTitle && (
          <p className="text-brand-gold text-[9px] font-bold uppercase tracking-[0.14em]">{occ.leadTitle}</p>
        )}
        <h3 className="text-brand-navy font-bold text-[13px] uppercase leading-tight">{occ.title}</h3>
        <p className="text-brand-navy/60 text-[11px] mt-0.5">
          {startTime}
          {occ.endTime ? `–${occ.endTime}` : ''}
          {occ.price != null ? ` · ${occ.price} PLN` : ''}
        </p>
      </div>

      <span className="self-center text-brand-navy/40 pr-3" aria-hidden>
        ›
      </span>
    </button>
  )
}

function EventPopover({
  occ,
  locale,
  onClose,
}: {
  occ: EventOccurrence
  locale: string
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = 'event-popover-title'

  useEffect(() => {
    closeRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const startTime = formatTime(occ.dateISO)
  const weekday = new Date(occ.dateISO)
  const dateLabel = weekday.toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: 'Europe/Warsaw',
  })
  const reserveLabel = locale === 'pl' ? 'Zarezerwuj stolik' : 'Reserve a table'
  const detailsLabel = locale === 'pl' ? 'Szczegóły wydarzenia' : 'Event details'
  const isSpecial = occ.eventType === 'special'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Backdrop — clicking the blurred area closes the popover (mouse convenience;
          keyboard/AT users use the Close button or Esc) */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-brand-navy/70 backdrop-blur-sm cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Image header */}
        <div className="relative h-40 bg-brand-navy">
          {occ.image?.url ? (
            <Image src={occ.image.url} alt={occ.image.alt || occ.title} fill className="object-cover" sizes="448px" />
          ) : (
            <div className="absolute inset-0 bg-brand-navy-royal" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 to-transparent" />
          {isSpecial && (
            <span className="absolute top-3 left-3 bg-brand-gold text-brand-navy text-[10px] font-bold uppercase tracking-[0.14em] px-3 py-1 rounded-full">
              {locale === 'pl' ? 'Wydarzenie specjalne' : 'Special event'}
            </span>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={locale === 'pl' ? 'Zamknij' : 'Close'}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-brand-navy flex items-center justify-center hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {occ.leadTitle && (
            <p className="text-brand-gold text-[11px] font-bold uppercase tracking-[0.16em] mb-1">
              {occ.leadTitle}
            </p>
          )}
          <h2 id={titleId} className="font-serif text-2xl font-bold text-brand-navy leading-tight mb-2">
            {occ.title}
          </h2>

          <p className="text-brand-navy/70 text-sm font-semibold capitalize mb-1">
            {dateLabel}
            {startTime ? ` · ${startTime}${occ.endTime ? `–${occ.endTime}` : ''}` : ''}
          </p>
          {occ.price != null && (
            <p className="text-brand-navy font-bold text-lg mb-3">{occ.price} PLN</p>
          )}

          {occ.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {occ.genres.map((g) => (
                <span
                  key={g}
                  className="border border-brand-navy/20 text-brand-navy/70 text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {occ.performers.length > 0 && (
            <p className="text-brand-navy/70 text-sm mb-4">
              <span className="font-semibold">{locale === 'pl' ? 'Wykonawcy: ' : 'Lineup: '}</span>
              {occ.performers
                .map((p) => (p.instrument ? `${p.name} (${p.instrument})` : p.name))
                .join(', ')}
            </p>
          )}

          {occ.description && (
            <p className="text-brand-navy/70 text-sm leading-relaxed mb-4">{occ.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <ReserveTrigger
              date={occ.dateISO}
              className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.1em] px-4 py-2 rounded-full hover:bg-brand-gold-dark transition-colors"
            >
              {reserveLabel}
            </ReserveTrigger>
            <AddToCalendar
              theme="dark"
              locale={locale}
              event={{
                id: occ.eventId,
                title: occ.title,
                description: occ.description ?? undefined,
                startISO: occ.dateISO,
                endTime: occ.endTime ?? undefined,
              }}
            />
          </div>

          <Link
            href={localeHref(locale as Locale, `/events/${occ.eventSlug}`)}
            className="inline-block mt-4 text-brand-navy/60 text-[12px] font-semibold uppercase tracking-[0.1em] hover:text-brand-navy"
          >
            {detailsLabel} ›
          </Link>
        </div>
      </div>
    </div>
  )
}

export function EventsFullCalendar({
  occurrences,
  initialYear,
  initialMonth,
  minMonthAbs,
  maxMonthAbs,
  todayKey,
  heading,
  ctaLabel,
  ctaUrl,
  locale,
}: Props) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [selected, setSelected] = useState<EventOccurrence | null>(null)

  const triggerRef = useRef<HTMLElement | null>(null)
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const monthAbs = year * 12 + month
  const prevDisabled = monthAbs <= minMonthAbs
  const nextDisabled = monthAbs >= maxMonthAbs

  const byDay = useMemo(() => groupByDay(occurrences), [occurrences])
  const weekDays = getWeekDays(locale)
  const cells = useMemo(() => buildCells(year, month, todayKey), [year, month, todayKey])

  // Events in the displayed month (Europe/Warsaw), for the mobile agenda list.
  const monthOccurrences = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`
    return occurrences.filter((o) => warsawDayKey(o.dateISO).startsWith(prefix))
  }, [occurrences, year, month])

  // Mobile agenda is progressively disclosed: start ~2 weeks ahead, reveal more.
  const [agendaWeeks, setAgendaWeeks] = useState(AGENDA_WEEK_STEP)
  useEffect(() => setAgendaWeeks(AGENDA_WEEK_STEP), [year, month])

  // Anchor: today for the current month (forward-looking), else the month's first event.
  const agendaAnchorKey = useMemo(() => {
    if (monthOccurrences.length === 0) return todayKey
    const isCurrentMonth = `${year}-${String(month + 1).padStart(2, '0')}` === todayKey.slice(0, 7)
    const firstKey = warsawDayKey(monthOccurrences[0].dateISO)
    if (isCurrentMonth && todayKey > firstKey) return todayKey
    return firstKey
  }, [monthOccurrences, year, month, todayKey])

  const agendaFromAnchor = useMemo(
    () => monthOccurrences.filter((o) => warsawDayKey(o.dateISO) >= agendaAnchorKey),
    [monthOccurrences, agendaAnchorKey],
  )
  const visibleAgenda = useMemo(() => {
    const cutoff = addDaysKey(agendaAnchorKey, agendaWeeks * 7)
    return agendaFromAnchor.filter((o) => warsawDayKey(o.dateISO) < cutoff)
  }, [agendaFromAnchor, agendaAnchorKey, agendaWeeks])
  const agendaHasMore = visibleAgenda.length < agendaFromAnchor.length

  // Roving tabindex: which cell currently owns tabIndex 0.
  const defaultActive = useMemo(() => {
    const todayCell = cells.find((c) => c.isToday && c.inMonth)
    if (todayCell) return todayCell.key
    const firstInMonth = cells.find((c) => c.inMonth)
    return firstInMonth?.key ?? cells[0]?.key
  }, [cells])
  const [activeKey, setActiveKey] = useState<string>(defaultActive)
  useEffect(() => setActiveKey(defaultActive), [defaultActive])

  const openPopover = useCallback((occ: EventOccurrence, trigger: HTMLElement) => {
    triggerRef.current = trigger
    setSelected(occ)
  }, [])

  const closePopover = useCallback(() => {
    setSelected(null)
    // Return focus to the element that opened the popover.
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  function prevMonth() {
    if (prevDisabled) return
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (nextDisabled) return
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else setMonth((m) => m + 1)
  }

  function focusCell(index: number) {
    const clamped = Math.max(0, Math.min(cells.length - 1, index))
    const key = cells[clamped].key
    setActiveKey(key)
    cellRefs.current[key]?.focus()
  }

  function onCellKeyDown(e: React.KeyboardEvent, index: number, cell: Cell) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        focusCell(index + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        focusCell(index - 1)
        break
      case 'ArrowDown':
        e.preventDefault()
        focusCell(index + COLUMNS)
        break
      case 'ArrowUp':
        e.preventDefault()
        focusCell(index - COLUMNS)
        break
      case 'Home':
        e.preventDefault()
        focusCell(index - (index % COLUMNS))
        break
      case 'End':
        e.preventDefault()
        focusCell(index - (index % COLUMNS) + (COLUMNS - 1))
        break
      case 'Enter':
      case ' ': {
        const dayEvents = byDay[cell.key] ?? []
        if (dayEvents.length > 0) {
          e.preventDefault()
          openPopover(dayEvents[0], cellRefs.current[cell.key] as HTMLElement)
        }
        break
      }
    }
  }

  const monthLabel = getMonthName(year, month, locale)
  const nextMonthName = getMonthName(
    month === 11 ? year + 1 : year,
    month === 11 ? 0 : month + 1,
    locale,
  )

  return (
    <section className="py-12 bg-white">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={prevMonth}
              disabled={prevDisabled}
              className="w-9 h-9 rounded-full border border-brand-navy/20 flex items-center justify-center hover:bg-brand-navy/5 transition-colors disabled:opacity-30"
              aria-label={locale === 'pl' ? 'Poprzedni miesiąc' : 'Previous month'}
            >
              <svg className="w-4 h-4 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h2 className="text-brand-navy text-2xl md:text-3xl font-black uppercase tracking-tight" aria-live="polite">
              {heading ? `${heading} — ` : ''}
              {monthLabel}
            </h2>

            <button
              onClick={nextMonth}
              disabled={nextDisabled}
              className="w-9 h-9 rounded-full border border-brand-navy/20 flex items-center justify-center hover:bg-brand-navy/5 transition-colors disabled:opacity-30"
              aria-label={locale === 'pl' ? 'Następny miesiąc' : 'Next month'}
            >
              <svg className="w-4 h-4 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {ctaLabel &&
            ctaUrl &&
            (() => {
              const calCtaClass =
                'hidden md:flex items-center gap-2 bg-brand-navy text-white text-[12px] font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded-full hover:bg-brand-navy/80 transition-colors whitespace-nowrap'
              const icon = (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
                </svg>
              )
              // Reservation CTA opens MyRest; any other link navigates normally.
              return isReservationUrl(ctaUrl) ? (
                <ReserveTrigger className={calCtaClass}>
                  {icon}
                  {ctaLabel}
                </ReserveTrigger>
              ) : (
                <Link href={ctaUrl} className={calCtaClass}>
                  {icon}
                  {ctaLabel}
                </Link>
              )
            })()}
        </div>

        {/* Calendar grid — desktop/tablet */}
        <div role="grid" aria-label={monthLabel} className="hidden sm:block">
          {/* Day headers */}
          <div role="row" className="grid grid-cols-6 gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                role="columnheader"
                className="text-center text-brand-navy/50 text-[12px] font-semibold uppercase tracking-wider py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {Array.from({ length: cells.length / COLUMNS }).map((_, wi) => (
            <div role="row" key={wi} className="grid grid-cols-6 gap-2 mb-2">
              {cells.slice(wi * COLUMNS, wi * COLUMNS + COLUMNS).map((cell, ci) => {
                const index = wi * COLUMNS + ci
                const dayEvents = byDay[cell.key] ?? []
                const hasEvents = dayEvents.length > 0
                return (
                  <div
                    role="gridcell"
                    key={cell.key}
                    ref={(el) => {
                      cellRefs.current[cell.key] = el
                    }}
                    tabIndex={activeKey === cell.key ? 0 : -1}
                    aria-current={cell.isToday ? 'date' : undefined}
                    aria-label={cell.date.toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                    onKeyDown={(e) => onCellKeyDown(e, index, cell)}
                    onFocus={() => setActiveKey(cell.key)}
                    className={`flex flex-col gap-1 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                      cell.inMonth ? '' : 'opacity-40'
                    } ${cell.isToday ? 'ring-2 ring-brand-gold' : ''}`}
                    style={{ minHeight: 150 }}
                  >
                    {hasEvents ? (
                      dayEvents.map((occ) => (
                        <div key={occ.id} style={{ height: 150 }}>
                          <EventCard occ={occ} locale={locale} onOpen={openPopover} />
                        </div>
                      ))
                    ) : (
                      <div
                        className={`h-full rounded-xl flex items-start p-2 ${
                          cell.isToday ? 'bg-brand-gold/10' : 'bg-gray-50'
                        }`}
                      >
                        {cell.isToday ? (
                          <span className="bg-brand-gold text-brand-navy text-[12px] font-bold px-2 py-0.5 rounded-md leading-none">
                            {cell.date.getDate()}
                          </span>
                        ) : (
                          <span className="text-brand-navy/30 text-[13px] font-medium">
                            {cell.date.getDate()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Mobile agenda — chronological list, progressively disclosed (~2 weeks at a time) */}
        <div className="sm:hidden">
          {agendaFromAnchor.length > 0 ? (
            <>
              <ul className="flex flex-col gap-3">
                {visibleAgenda.map((occ) => (
                  <li key={occ.id}>
                    <AgendaItem occ={occ} locale={locale} onOpen={openPopover} />
                  </li>
                ))}
              </ul>
              {agendaHasMore && (
                <button
                  type="button"
                  onClick={() => setAgendaWeeks((w) => w + AGENDA_WEEK_STEP)}
                  className="mt-4 w-full flex items-center justify-center gap-2 border border-brand-navy/20 text-brand-navy text-[12px] font-bold uppercase tracking-[0.1em] py-3 rounded-full hover:bg-brand-navy/5 transition-colors"
                >
                  {locale === 'pl' ? 'Pokaż dalsze dni' : 'Show more days'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <p className="text-brand-navy/50 text-sm py-8 text-center">
              {locale === 'pl' ? 'Brak nadchodzących wydarzeń w tym miesiącu.' : 'No upcoming events this month.'}
            </p>
          )}
        </div>

        {/* Next month button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={nextMonth}
            disabled={nextDisabled}
            className="flex items-center gap-3 bg-brand-navy text-white text-[13px] font-bold uppercase tracking-[0.1em] px-8 py-3 rounded-full hover:bg-brand-navy/80 transition-colors disabled:opacity-30"
          >
            {nextMonthName}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {selected && <EventPopover occ={selected} locale={locale} onClose={closePopover} />}
    </section>
  )
}
