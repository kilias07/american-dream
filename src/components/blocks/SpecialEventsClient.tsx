'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getDayAbbr, warsawDayKey } from '@/lib/recurring-events'
import { ReserveTrigger } from '@/components/reservations/MyRest'

export type SpecialEventCard = {
  id: number
  title: string
  performers: string[]
  dateISO: string | null
  image: { url: string; alt: string } | null
  ticketUrl: string | null
}

type Props = {
  cards: SpecialEventCard[]
  locale: string
}

function PosterCard({ card, locale }: { card: SpecialEventCard; locale: string }) {
  const reserveLabel = locale === 'pl' ? 'Zarezerwuj stolik' : 'Reserve a table'
  let dayNum = ''
  let dayAbbr = ''
  if (card.dateISO) {
    dayNum = warsawDayKey(card.dateISO).slice(-2)
    dayAbbr = getDayAbbr(new Date(card.dateISO), locale)
  }

  return (
    <div
      data-card
      className="relative flex-shrink-0 w-[75vw] sm:w-[300px] rounded-2xl overflow-hidden bg-brand-navy-royal group"
      style={{ minHeight: 440 }}
    >
      {card.image?.url ? (
        <Image
          src={card.image.url}
          alt={card.image.alt || card.title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 75vw, 300px"
        />
      ) : (
        /* Poster gradient fallback — evokes a night concert atmosphere */
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170D35] to-[#0e1a4a]">
          {/* Subtle radial glow for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,rgba(248,171,0,0.12),transparent)]" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/55 to-brand-navy/15" />

      {card.dateISO && (
        <div className="absolute top-4 left-4 bg-brand-gold text-brand-navy text-center rounded-md px-3 py-1.5 leading-none z-10">
          <div className="text-[10px] font-bold uppercase tracking-wider">{dayAbbr}</div>
          <div className="text-[24px] font-bold leading-none">{dayNum}</div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
        <h3 className="text-white font-bold text-lg uppercase tracking-wide leading-tight mb-1">
          {card.title}
        </h3>
        {card.performers.length > 0 && (
          <p className="text-white/70 text-sm leading-snug mb-4">{card.performers.join(', ')}</p>
        )}
        <ReserveTrigger
          date={card.dateISO}
          className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors"
        >
          {reserveLabel}
        </ReserveTrigger>
      </div>
    </div>
  )
}

export function SpecialEventsClient({ cards, locale }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [scrollable, setScrollable] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const updateState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    // Only show navigation when the track actually overflows.
    setScrollable(el.scrollWidth > el.clientWidth + 4)
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    const card = el.querySelector('[data-card]') as HTMLElement | null
    const step = card ? card.offsetWidth + 16 : 316
    setActiveIndex(Math.round(el.scrollLeft / step))
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    updateState()
    el.addEventListener('scroll', updateState, { passive: true })
    window.addEventListener('resize', updateState)
    return () => {
      el.removeEventListener('scroll', updateState)
      window.removeEventListener('resize', updateState)
    }
  }, [updateState])

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('[data-card]') as HTMLElement | null
    const step = card ? card.offsetWidth + 16 : 316
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="relative flex items-center gap-3">
        {scrollable && (
          <button
            onClick={() => scroll(-1)}
            disabled={!canPrev}
            className="hidden md:flex flex-shrink-0 w-11 h-11 rounded-full border-2 border-white/60 bg-transparent disabled:opacity-30 items-center justify-center transition-colors hover:bg-white/10 text-white"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div
          ref={trackRef}
          className="overflow-x-auto flex-1 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-4">
            {cards.map((card) => (
              <PosterCard key={card.id} card={card} locale={locale} />
            ))}
          </div>
        </div>

        {scrollable && (
          <button
            onClick={() => scroll(1)}
            disabled={!canNext}
            className="hidden md:flex flex-shrink-0 w-11 h-11 rounded-full border-2 border-white/60 bg-transparent disabled:opacity-30 items-center justify-center transition-colors hover:bg-white/10 text-white"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {scrollable && cards.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {cards.map((card, i) => (
            <span
              key={card.id}
              className={`h-2 rounded-full transition-all ${i === activeIndex ? 'w-6 bg-brand-gold' : 'w-2 bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
