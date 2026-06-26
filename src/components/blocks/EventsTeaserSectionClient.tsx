'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getDayAbbr, formatTime, warsawDayKey } from '@/lib/recurring-events'
import { localeHref } from '@/utilities/href'
import type { Locale } from '@/config/locales'

export type TeaserEventCard = {
  id: number
  title: string
  href: string
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

  // "Aktualny dzień" — dzisiejsze wydarzenie dostaje POMARAŃCZOWĄ wstęgę (badge),
  // każdy inny dzień NIEBIESKĄ (jak w projekcie ADC_Home). todayKey ustawiany jest
  // po stronie klienta (useEffect), więc nie ma ryzyka niezgodności hydratacji.
  const isToday = Boolean(card.dateISO && todayKey && warsawDayKey(card.dateISO) === todayKey)

  // 1:1 z projektem ADC_Home: domyślnie kafelka pokazuje tylko tytuł + strzałkę,
  // a na hover/focus odsłania godzinę, cenę i przycisk ZAREZERWUJ (stan „HOVER STATE").
  // Cała kafelka jest klikalna (rozciągnięty link) → strona wydarzenia.
  return (
    <div
      data-card
      className="group relative flex-shrink-0 w-[63vw] sm:w-[210px] rounded-2xl overflow-hidden bg-brand-navy"
      style={{ minHeight: 290 }}
    >
      {card.image?.url ? (
        <Image
          src={card.image.url}
          alt={card.image.alt || card.title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 63vw, 210px"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy/80" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/65 to-brand-navy/20" />

      {/* Rozciągnięty link — cała kafelka prowadzi na stronę wydarzenia */}
      <Link
        href={card.href}
        aria-label={card.title}
        className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
      />

      {/* Badge — dzień tygodnia + numer dnia. Pomarańczowy gdy dziś, niebieski w inne dni. */}
      {card.dateISO && (
        <div
          className={`pointer-events-none absolute top-3 left-3 text-center rounded-md px-2.5 py-1.5 leading-none z-20 shadow-md ${
            isToday ? 'bg-brand-gold text-brand-navy' : 'bg-[#1B6EC2] text-white'
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-wider">{dayAbbr}</div>
          <div className="text-[22px] font-bold leading-none mt-0.5">{dayNum}</div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3.5 z-20">
        <h3 className="text-white font-bold text-[13px] uppercase leading-tight">
          {card.title} <span className="inline-block text-brand-gold">›</span>
        </h3>

        {/* Godzina + cena + ZAREZERWUJ — ukryte, pojawiają się na hover/focus (HOVER STATE) */}
        <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
          <div className="overflow-hidden">
            <div className="flex items-end justify-between gap-2 pt-2.5">
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

              {/* CTA — prowadzi do strony rezerwacji; pointer-events-auto + z-30 by klik trafiał w przycisk, nie w link karty */}
              <Link
                href={localeHref(locale as Locale, '/rezerwacje')}
                className="pointer-events-auto relative z-30 flex-shrink-0 inline-flex items-center bg-brand-gold text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full hover:bg-brand-gold-dark transition-colors"
              >
                {reserveLabel}
              </Link>
            </div>
          </div>
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
