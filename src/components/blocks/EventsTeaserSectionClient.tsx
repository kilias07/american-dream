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

function EventCard({ card, locale }: { card: TeaserEventCard; locale: string }) {
  const ticketsLabel = locale === 'pl' ? 'Bilety' : 'Tickets'
  let dayNum = ''
  let dayAbbr = ''
  let startTime = ''
  if (card.dateISO) {
    dayNum = warsawDayKey(card.dateISO).slice(-2)
    dayAbbr = getDayAbbr(new Date(card.dateISO), locale)
    startTime = formatTime(card.dateISO)
  }

  return (
    <div
      data-card
      className="relative flex-shrink-0 w-[63vw] sm:w-[230px] rounded-2xl overflow-hidden bg-brand-navy group"
      style={{ minHeight: 290 }}
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

      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-brand-navy/25" />

      {card.dateISO && (
        <div className="absolute top-3 left-3 bg-brand-navy text-white text-center rounded-md px-2 py-1 leading-none z-10">
          <div className="text-[10px] font-bold uppercase tracking-wider">{dayAbbr}</div>
          <div className="text-[22px] font-bold leading-none">{dayNum}</div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h3 className="text-white font-bold text-[13px] uppercase leading-tight mb-2">{card.title}</h3>

        <div className="flex items-center gap-3 text-white/80 text-[11px] mb-2">
          {startTime && (
            <span>
              {startTime}
              {card.endTime ? ` – ${card.endTime}` : ''}
            </span>
          )}
          {card.price != null && <span>{card.price} PLN</span>}
        </div>

        <ReserveTrigger
          date={card.dateISO}
          className="inline-flex items-center gap-1 bg-brand-gold text-brand-navy text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full hover:bg-brand-gold-dark transition-colors"
        >
          {ticketsLabel}
        </ReserveTrigger>
      </div>
    </div>
  )
}

export function EventsTeaserSectionClient({ cards, locale }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

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
            <EventCard key={card.id} card={card} locale={locale} />
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
