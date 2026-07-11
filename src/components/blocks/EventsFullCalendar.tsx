'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import type { EventOccurrence } from '@/lib/recurring-events'
import {
  addDaysKey,
  formatTime,
  getDayAbbr,
  getWeekDays,
  groupByDay,
  warsawDayKey,
  weekTueKey,
} from '@/lib/recurring-events'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'

/**
 * Kalendarz PROGRAM — widok TYGODNIOWY (uwagi klienta 2026-07):
 *  - u góry zawsze bieżący tydzień (wyróżniony złotym pasem, spójnie z home),
 *    pod nim 2 nadchodzące tygodnie; bez strzałek miesięcy u góry;
 *  - pod kalendarzem przyciski prawo-lewo — tygodnie rolują góra-dół w ramach
 *    tej samej wysokości komponentu (minione tygodnie wyszarzone);
 *  - 3-literowe labelki miesięcy (STY…GRU) w lewej rynnie;
 *  - kafelki z KOLOROWYM zdjęciem + granatową przesłoną (bez grayscale).
 * Poniedziałki (klub zamknięty) pominięte — tydzień = wt→nd, 6 kolumn.
 */

/** Each event links to its own detail page. */
function eventHref(occ: EventOccurrence, locale: string): string {
  return localeHref(locale as Locale, occ.eventSlug ? `/events/${occ.eventSlug}` : '/events')
}

type Props = {
  occurrences: EventOccurrence[]
  /** Today's Europe/Warsaw day key (YYYY-MM-DD), from the server. */
  todayKey: string
  /** Tuesday-key of the earliest navigable club week (wt→nd). */
  minWeekKey: string
  /** Tuesday-key of the latest navigable club week. */
  maxWeekKey: string
  heading?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  locale: string
}

type Cell = { key: string; dayNum: number; isPast: boolean; isToday: boolean }
type Week = { tueKey: string; month: number; cells: Cell[]; containsToday: boolean }

const COLUMNS = 6 // wt→nd (poniedziałki pominięte)
const VISIBLE_WEEKS = 3 // bieżący + 2 nadchodzące
const ROW_H = 150

const MONTHS_3_PL = ['STY', 'LUT', 'MAR', 'KWI', 'MAJ', 'CZE', 'LIP', 'SIE', 'WRZ', 'PAŹ', 'LIS', 'GRU']
const MONTHS_3_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function buildWeeks(minWeekKey: string, maxWeekKey: string, todayKey: string): Week[] {
  const weeks: Week[] = []
  for (let tue = minWeekKey; tue <= maxWeekKey; tue = addDaysKey(tue, 7)) {
    const cells: Cell[] = []
    for (let i = 0; i < COLUMNS; i++) {
      const key = addDaysKey(tue, i)
      cells.push({
        key,
        dayNum: Number(key.slice(-2)),
        isPast: key < todayKey,
        isToday: key === todayKey,
      })
    }
    weeks.push({
      tueKey: tue,
      month: Number(tue.slice(5, 7)) - 1,
      cells,
      containsToday: tue === weekTueKey(todayKey),
    })
  }
  return weeks
}

/** Czytelna data dla ARIA (z klucza dnia — UTC, bez przesunięć stref). */
function ariaDate(key: string, locale: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

const AGENDA_WEEK_STEP = 2 // weeks revealed initially and per "show more" click

function EventCard({ occ, locale, todayKey }: { occ: EventOccurrence; locale: string; todayKey: string }) {
  const dayAbbr = getDayAbbr(new Date(occ.dateISO), locale)
  const dayNum = warsawDayKey(occ.dateISO).slice(-2)
  const startTime = formatTime(occ.dateISO)
  const isToday = warsawDayKey(occ.dateISO) === todayKey

  return (
    <Link
      href={eventHref(occ, locale)}
      tabIndex={-1}
      className="relative block w-full h-full rounded-xl overflow-hidden bg-brand-navy group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
      aria-label={`${occ.title}, ${dayAbbr} ${dayNum}, ${startTime}`}
    >
      {occ.image?.url ? (
        /* Kolorowe zdjęcie z granatową przesłoną (uwaga klienta: bez czarno-białych) */
        <Image
          src={occ.image.url}
          alt={occ.image.alt || occ.title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 14vw"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy/90" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/95 via-brand-navy/60 to-brand-navy/30" />

      {/* Day badge — gold for today's events, blue for upcoming days */}
      <div
        className={`absolute top-2 left-2 text-center rounded-md px-2 py-1 leading-none z-10 ${
          isToday ? 'bg-brand-gold text-brand-navy' : 'bg-[#1B6EC2] text-white'
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
    </Link>
  )
}

function AgendaItem({ occ, locale, todayKey }: { occ: EventOccurrence; locale: string; todayKey: string }) {
  const dayAbbr = getDayAbbr(new Date(occ.dateISO), locale)
  const dayNum = warsawDayKey(occ.dateISO).slice(-2)
  const startTime = formatTime(occ.dateISO)
  const isToday = warsawDayKey(occ.dateISO) === todayKey

  return (
    <Link
      href={eventHref(occ, locale)}
      className="flex items-stretch w-full text-left rounded-xl overflow-hidden bg-white ring-1 ring-brand-navy/10 hover:ring-brand-navy/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
    >
      {/* Date badge — gold for today's events, navy for upcoming days */}
      <div
        className={`flex flex-col items-center justify-center w-16 shrink-0 py-3 ${
          isToday ? 'bg-brand-gold text-brand-navy' : 'bg-brand-navy text-white'
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider">{dayAbbr}</span>
        <span className="text-2xl font-black leading-none">{dayNum}</span>
      </div>

      {/* Thumb — kolor (bez grayscale) */}
      {occ.image?.url && (
        <div className="relative w-16 shrink-0 bg-brand-navy">
          <Image
            src={occ.image.url}
            alt={occ.image.alt || occ.title}
            fill
            className="object-cover"
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
    </Link>
  )
}

export function EventsFullCalendar({
  occurrences,
  todayKey,
  minWeekKey,
  maxWeekKey,
  heading,
  ctaLabel,
  ctaUrl,
  locale,
}: Props) {
  const router = useRouter()

  const byDay = useMemo(() => groupByDay(occurrences), [occurrences])
  const weekDays = getWeekDays(locale)
  const weeks = useMemo(() => buildWeeks(minWeekKey, maxWeekKey, todayKey), [minWeekKey, maxWeekKey, todayKey])
  const months3 = locale === 'pl' ? MONTHS_3_PL : MONTHS_3_EN

  const maxAnchor = Math.max(0, weeks.length - VISIBLE_WEEKS)
  const todayAnchor = useMemo(() => {
    const idx = weeks.findIndex((w) => w.tueKey === weekTueKey(todayKey))
    return Math.max(0, Math.min(maxAnchor, idx === -1 ? 0 : idx))
  }, [weeks, todayKey, maxAnchor])

  // Anchor = indeks górnego widocznego tygodnia; start: bieżący tydzień.
  const [anchor, setAnchor] = useState(todayAnchor)
  const dirRef = useRef(1) // 1 = w przód (rolowanie w górę), -1 = w tył
  const visible = weeks.slice(anchor, anchor + VISIBLE_WEEKS)

  const prevDisabled = anchor <= 0
  const nextDisabled = anchor >= maxAnchor

  function prevWeeks() {
    if (prevDisabled) return
    dirRef.current = -1
    setAnchor((a) => Math.max(0, a - 1))
  }
  function nextWeeks() {
    if (nextDisabled) return
    dirRef.current = 1
    setAnchor((a) => Math.min(maxAnchor, a + 1))
  }

  // Mobile agenda — od bieżącego tygodnia w przód, odsłaniana po ~2 tygodnie.
  const [agendaWeeks, setAgendaWeeks] = useState(AGENDA_WEEK_STEP)
  const agendaFromAnchor = useMemo(() => {
    const start = weekTueKey(todayKey)
    return occurrences.filter((o) => warsawDayKey(o.dateISO) >= start)
  }, [occurrences, todayKey])
  const visibleAgenda = useMemo(() => {
    const cutoff = addDaysKey(weekTueKey(todayKey), agendaWeeks * 7)
    return agendaFromAnchor.filter((o) => warsawDayKey(o.dateISO) < cutoff)
  }, [agendaFromAnchor, todayKey, agendaWeeks])
  const agendaHasMore = visibleAgenda.length < agendaFromAnchor.length

  // Roving tabindex + focus po przewinięciu tygodni strzałkami góra/dół.
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const pendingFocusRef = useRef<string | null>(null)
  const visibleCells = useMemo(() => visible.flatMap((w) => w.cells), [visible])
  const [activeKey, setActiveKey] = useState<string>(() => {
    const todayCell = visibleCells.find((c) => c.isToday)
    return todayCell?.key ?? visibleCells[0]?.key ?? ''
  })
  useEffect(() => {
    if (pendingFocusRef.current) {
      const el = cellRefs.current[pendingFocusRef.current]
      if (el) {
        setActiveKey(pendingFocusRef.current)
        el.focus()
      }
      pendingFocusRef.current = null
    }
  }, [anchor])

  function focusKey(key: string) {
    const el = cellRefs.current[key]
    if (el) {
      setActiveKey(key)
      el.focus()
    }
  }

  function onCellKeyDown(e: React.KeyboardEvent, cell: Cell) {
    const move = (days: number) => {
      const target = addDaysKey(cell.key, days)
      const targetTue = weekTueKey(target)
      if (targetTue < minWeekKey || targetTue > maxWeekKey) return
      const idx = weeks.findIndex((w) => w.tueKey === targetTue)
      if (idx < anchor || idx >= anchor + VISIBLE_WEEKS) {
        dirRef.current = idx < anchor ? -1 : 1
        pendingFocusRef.current = target
        setAnchor(Math.max(0, Math.min(maxAnchor, idx < anchor ? idx : idx - VISIBLE_WEEKS + 1)))
      } else {
        focusKey(target)
      }
    }
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        // niedziela → wtorek następnego tygodnia (pomijamy poniedziałek)
        move(cell.key === addDaysKey(weekTueKey(cell.key), 5) ? 2 : 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        move(cell.key === weekTueKey(cell.key) ? -2 : -1)
        break
      case 'ArrowDown':
        e.preventDefault()
        move(7)
        break
      case 'ArrowUp':
        e.preventDefault()
        move(-7)
        break
      case 'Home':
        e.preventDefault()
        focusKey(weekTueKey(cell.key))
        break
      case 'End':
        e.preventDefault()
        focusKey(addDaysKey(weekTueKey(cell.key), 5))
        break
      case 'Enter':
      case ' ': {
        const dayEvents = byDay[cell.key] ?? []
        if (dayEvents.length > 0) {
          e.preventDefault()
          router.push(eventHref(dayEvents[0], locale))
        }
        break
      }
    }
  }

  const rangeLabel = visible.length
    ? `${ariaDate(visible[0].cells[0].key, locale)} – ${ariaDate(visible[visible.length - 1].cells[5].key, locale)}`
    : ''

  return (
    <section className="py-12 bg-white">
      <div className="container">
        {/* Header — bez strzałek miesięcy (nawigacja przyciskami POD kalendarzem) */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-brand-navy text-2xl md:text-3xl font-black uppercase tracking-tight">
            {heading || (locale === 'pl' ? 'KALENDARZ' : 'CALENDAR')}
          </h2>
          <span className="sr-only" aria-live="polite">
            {rangeLabel}
          </span>

          {ctaLabel && ctaUrl && (
            <Link
              href={ctaUrl.startsWith('/') ? localeHref(locale as Locale, ctaUrl) : ctaUrl}
              className="hidden md:flex items-center gap-2 bg-brand-navy text-white text-[12px] font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded-full hover:bg-brand-navy/80 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
              </svg>
              {ctaLabel}
            </Link>
          )}
        </div>

        {/* Calendar grid — desktop/tablet: bieżący tydzień + 2 nadchodzące */}
        <div role="grid" aria-label={rangeLabel} className="hidden sm:block">
          {/* Day headers (z pustą rynną miesięcy po lewej) */}
          <div role="row" className="grid grid-cols-[2.75rem_repeat(6,1fr)] gap-2 mb-2">
            <div aria-hidden />
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

          {/* Weeks — stała wysokość, rolowanie góra-dół (Motion) */}
          <div className="overflow-hidden" style={{ height: VISIBLE_WEEKS * (ROW_H + 8) }}>
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((week, wi) => {
                const showMonth = wi === 0 || week.month !== visible[wi - 1].month
                const isPastWeek = week.cells[5].key < todayKey
                return (
                  <motion.div
                    role="row"
                    key={week.tueKey}
                    initial={{ y: dirRef.current * 48, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: dirRef.current * -48, opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                    className={`grid grid-cols-[2.75rem_repeat(6,1fr)] gap-2 mb-2 rounded-xl ${
                      week.containsToday ? 'bg-brand-gold p-1.5 -mx-1.5' : ''
                    } ${isPastWeek ? 'opacity-50' : ''}`}
                  >
                    {/* Rynna: 3-literowy miesiąc (STY…GRU) */}
                    <div
                      aria-hidden
                      className={`flex items-center justify-center text-[11px] font-black tracking-wider ${
                        week.containsToday ? 'text-brand-navy' : 'text-brand-navy/45'
                      }`}
                    >
                      {showMonth ? months3[week.month] : ''}
                    </div>

                    {week.cells.map((cell) => {
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
                          aria-label={ariaDate(cell.key, locale)}
                          onKeyDown={(e) => onCellKeyDown(e, cell)}
                          onFocus={() => setActiveKey(cell.key)}
                          className={`flex flex-col gap-1 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                            cell.isPast ? 'opacity-60' : ''
                          } ${cell.isToday ? 'ring-2 ring-brand-navy' : ''}`}
                          style={{ minHeight: ROW_H }}
                        >
                          {hasEvents ? (
                            dayEvents.map((occ) => (
                              <div key={occ.id} style={{ height: ROW_H }}>
                                <EventCard occ={occ} locale={locale} todayKey={todayKey} />
                              </div>
                            ))
                          ) : (
                            <div
                              className={`h-full rounded-xl flex items-start p-2 ${
                                cell.isToday
                                  ? 'bg-white/60'
                                  : week.containsToday
                                    ? 'bg-white/40'
                                    : 'bg-gray-50'
                              }`}
                            >
                              {cell.isToday ? (
                                <span className="bg-brand-navy text-white text-[12px] font-bold px-2 py-0.5 rounded-md leading-none">
                                  {cell.dayNum}
                                </span>
                              ) : (
                                <span className="text-brand-navy/30 text-[13px] font-medium">
                                  {cell.dayNum}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Przyciski prawo-lewo POD kalendarzem — rolują tygodnie góra-dół */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={prevWeeks}
              disabled={prevDisabled}
              className="w-11 h-11 rounded-full border border-brand-navy/20 flex items-center justify-center text-brand-navy hover:bg-brand-navy/5 transition-colors disabled:opacity-30"
              aria-label={locale === 'pl' ? 'Poprzednie tygodnie' : 'Previous weeks'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextWeeks}
              disabled={nextDisabled}
              className="w-11 h-11 rounded-full border border-brand-navy/20 flex items-center justify-center text-brand-navy hover:bg-brand-navy/5 transition-colors disabled:opacity-30"
              aria-label={locale === 'pl' ? 'Następne tygodnie' : 'Next weeks'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile agenda — chronological list, progressively disclosed (~2 weeks at a time) */}
        <div className="sm:hidden">
          {agendaFromAnchor.length > 0 ? (
            <>
              <ul className="flex flex-col gap-3">
                {visibleAgenda.map((occ) => (
                  <li key={occ.id}>
                    <AgendaItem occ={occ} locale={locale} todayKey={todayKey} />
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
              {locale === 'pl' ? 'Brak nadchodzących wydarzeń.' : 'No upcoming events.'}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
