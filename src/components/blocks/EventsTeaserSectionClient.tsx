'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getDayAbbr, formatTime, warsawDayKey } from '@/lib/recurring-events'
import { ReserveTrigger } from '@/components/reservations/MyRest'

export type TeaserEventCard = {
  id: number
  title: string
  dateISO: string | null
  endTime: string | null
  price: number | null
  image: { url: string; alt: string } | null
  ticketUrl: string | null
}

type Props = {
  cards: TeaserEventCard[]
  locale: string
}

function EventCard({
  card,
  locale,
  todayKey,
}: {
  card: TeaserEventCard
  locale: string
  todayKey: string
}) {
  const reserveLabel = locale === 'pl' ? 'Zarezerwuj' : 'Book now'
  let dayNum = ''
  let dayAbbr = ''
  let startTime = ''
  if (card.dateISO) {
    dayNum = warsawDayKey(card.dateISO).slice(-2)
    dayAbbr = getDayAbbr(new Date(card.dateISO), locale)
    startTime = formatTime(card.dateISO)
  }

  // "Aktualny dzień" — dzisiejsze wydarzenie dostaje złotą ramkę (jak w projekcie).
  // todayKey ustawiany jest po stronie klienta (useEffect), więc nie ma ryzyka
  // niezgodności hydratacji. Na hover ramka pojawia się dla każdej kafelki.
  const isToday = Boolean(card.dateISO && todayKey && warsawDayKey(card.dateISO) === todayKey)

  return (
    <div
      data-card
      className={`relative flex-shrink-0 w-[63vw] sm:w-[230px] rounded-2xl overflow-hidden bg-brand-navy group ring-brand-gold transition-all duration-200 hover:ring-[3px] ${isToday ? 'ring-[3px]' : 'ring-0'}`}
      style={{ minHeight: 300 }}
    >
      {card.image?.url ? (
        <Image
          src={card.image.url}
          alt={card.image.alt || card.title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 63vw, 230px"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy/80" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/65 to-brand-navy/20" />

      {/* Badge — dzień tygodnia + numer dnia */}
      {card.dateISO && (
        <div className="absolute top-3 left-3 bg-brand-navy text-white text-center rounded-md px-2.5 py-1.5 leading-none z-10 shadow-md">
          <div className="text-[10px] font-bold uppercase tracking-wider">{dayAbbr}</div>
          <div className="text-[22px] font-bold leading-none mt-0.5">{dayNum}</div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10">
        <h3 className="text-white font-bold text-[13px] uppercase leading-tight mb-2.5">
          {card.title} <span className="inline-block text-brand-gold">›</span>
        </h3>

        <div className="flex items-end justify-between gap-2">
          {/* Godzina + cena (stos) */}
          <div className="flex flex-col gap-1 text-white/85 text-[11px] font-medium">
            {startTime && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
                </svg>
                {startTime}
                {card.endTime ? ` – ${card.endTime}` : ''}
              </span>
            )}
            {card.price != null && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2z" />
                </svg>
                {card.price} PLN
              </span>
            )}
          </div>

          {/* CTA — otwiera widget MyRest z datą wydarzenia */}
          <ReserveTrigger
            date={card.dateISO}
            className="flex-shrink-0 inline-flex items-center bg-brand-gold text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full hover:bg-brand-gold-dark transition-colors"
          >
            {reserveLabel}
          </ReserveTrigger>
        </div>
      </div>
    </div>
  )
}

export function EventsTeaserSectionClient({ cards, locale }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  // Klucz „dzisiejszego" dnia (Europe/Warsaw) — liczony po stronie klienta, by
  // podświetlić złotą ramką kafelkę z aktualnym dniem bez ryzyka hydratacji.
  const [todayKey, setTodayKey] = useState('')

  useEffect(() => {
    setTodayKey(warsawDayKey(new Date().toISOString()))
  }, [])

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [updateArrows])

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('[data-card]') as HTMLElement | null
    const step = card ? card.offsetWidth + 12 : 242
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <div className="relative flex items-center gap-3">
      <button
        onClick={() => scroll(-1)}
        disabled={!canPrev}
        className="hidden md:flex flex-shrink-0 w-11 h-11 rounded-full border-2 border-brand-navy bg-transparent disabled:opacity-30 items-center justify-center transition-colors hover:bg-brand-navy/10 text-brand-navy"
        aria-label="Previous"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div
        ref={trackRef}
        className="overflow-x-auto flex-1 pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex gap-3">
          {cards.map((card) => (
            <EventCard key={card.id} card={card} locale={locale} todayKey={todayKey} />
          ))}
        </div>
      </div>

      <button
        onClick={() => scroll(1)}
        disabled={!canNext}
        className="hidden md:flex flex-shrink-0 w-11 h-11 rounded-full border-2 border-brand-navy bg-transparent disabled:opacity-30 items-center justify-center transition-colors hover:bg-brand-navy/10 text-brand-navy"
        aria-label="Next"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
