'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { EventOccurrence } from '@/lib/recurring-events'
import { getMonthName, getWeekDays, groupByDay } from '@/lib/recurring-events'

type Props = {
  initialOccurrences: EventOccurrence[]
  initialYear: number
  initialMonth: number // 0-indexed
  heading?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  locale: string
}

function EventCard({ occ, locale }: { occ: EventOccurrence; locale: string }) {
  const date = new Date(occ.dateISO)
  const dayAbbr = date.toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-GB', { weekday: 'short' }).toUpperCase().replace('.', '')
  const dayNum = String(date.getDate()).padStart(2, '0')
  const startTime = date.toLocaleTimeString(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const inner = (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-brand-navy group cursor-pointer">
      {occ.image?.url ? (
        <Image
          src={occ.image.url}
          alt={occ.image.alt || occ.title}
          fill
          className="object-cover object-center grayscale group-hover:grayscale-0 transition-all duration-300"
          sizes="(max-width: 768px) 50vw, 17vw"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy/90" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/95 via-brand-navy/50 to-brand-navy/20" />

      {/* Day badge */}
      <div className="absolute top-2 left-2 bg-[#1B6EC2] text-white text-center rounded-md px-2 py-1 leading-none z-10">
        <div className="text-[9px] font-bold uppercase tracking-wider">{dayAbbr}</div>
        <div className="text-[18px] font-bold leading-none">{dayNum}</div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10">
        <h3 className="text-white font-bold text-[11px] uppercase leading-tight mb-1">
          {occ.title}
          {' '}
          <span className="text-white/60">›</span>
        </h3>
        {(startTime || occ.endTime) && (
          <p className="text-white/70 text-[10px]">
            {startTime}{occ.endTime ? ` - ${occ.endTime}` : ''}
          </p>
        )}
        {occ.price != null && (
          <p className="text-white/70 text-[10px]">{occ.price} PLN</p>
        )}
      </div>
    </div>
  )

  if (occ.ticketUrl) {
    return (
      <Link href={occ.ticketUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
        {inner}
      </Link>
    )
  }
  return inner
}

function buildCalendarGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Week starts Monday: getDay() returns 0=Sun, so Monday=1 → offset = (day + 6) % 7
  const startOffset = (firstDay.getDay() + 6) % 7

  const days: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < days.length; i += 7) {
    const week = days.slice(i, i + 7)
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }
  return weeks
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function EventsFullCalendar({
  initialOccurrences,
  initialYear,
  initialMonth,
  heading,
  ctaLabel,
  ctaUrl,
  locale,
}: Props) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [occurrences, setOccurrences] = useState<EventOccurrence[]>(initialOccurrences)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (year === initialYear && month === initialMonth) {
      setOccurrences(initialOccurrences)
      return
    }
    setLoading(true)
    fetch(`/api/events-by-month?month=${year}-${String(month + 1).padStart(2, '0')}&locale=${locale}`)
      .then((r) => r.json() as Promise<{ occurrences?: EventOccurrence[] }>)
      .then((data) => {
        setOccurrences(data.occurrences ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [year, month]) // eslint-disable-line react-hooks/exhaustive-deps

  const weekDays = getWeekDays(locale)
  const grid = buildCalendarGrid(year, month)
  const byDay = groupByDay(occurrences)

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

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
              className="w-9 h-9 rounded-full border border-brand-navy/20 flex items-center justify-center hover:bg-brand-navy/5 transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-4 h-4 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h2 className="text-brand-navy text-2xl md:text-3xl font-black uppercase tracking-tight">
              {heading ? `${heading} — ` : ''}{getMonthName(year, month, locale)}
            </h2>

            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-full border border-brand-navy/20 flex items-center justify-center hover:bg-brand-navy/5 transition-colors"
              aria-label="Next month"
            >
              <svg className="w-4 h-4 text-brand-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {ctaLabel && ctaUrl && (
            <Link
              href={ctaUrl}
              className="hidden md:flex items-center gap-2 bg-brand-navy text-white text-[12px] font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded-full hover:bg-brand-navy/80 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
              </svg>
              {ctaLabel}
            </Link>
          )}
        </div>

        {/* Calendar grid */}
        <div className={`transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-brand-navy/50 text-[12px] font-semibold uppercase tracking-wider py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-2 mb-2">
              {week.map((day, di) => {
                if (!day) return <div key={di} />
                const key = toKey(day)
                const dayEvents = byDay[key] ?? []
                return (
                  <div key={di} className="flex flex-col gap-1" style={{ minHeight: 160 }}>
                    {dayEvents.length > 0 ? (
                      dayEvents.map((occ) => (
                        <div key={occ.id} style={{ height: 160 }}>
                          <EventCard occ={occ} locale={locale} />
                        </div>
                      ))
                    ) : (
                      <div className="h-full rounded-xl bg-gray-50 flex items-start p-2">
                        <span className="text-brand-navy/20 text-[13px] font-medium">
                          {day.getDate()}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Next month button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={nextMonth}
            className="flex items-center gap-3 bg-brand-navy text-white text-[13px] font-bold uppercase tracking-[0.1em] px-8 py-3 rounded-full hover:bg-brand-navy/80 transition-colors"
          >
            {nextMonthName}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
