'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export type UpcomingCard = {
  id: number
  href: string
  title: string
  dateLabel: string
  image: { url: string; alt: string } | null
}

type Props = {
  cards: UpcomingCard[]
}

function EventCard({ card }: { card: UpcomingCard }) {
  return (
    <Link
      href={card.href}
      data-card
      className="group relative flex-shrink-0 w-[68vw] sm:w-[300px] rounded-xl overflow-hidden bg-brand-navy"
      style={{ minHeight: 340 }}
    >
      {card.image?.url ? (
        <Image
          src={card.image.url}
          alt={card.image.alt || card.title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 68vw, 300px"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {card.dateLabel && (
          <p className="text-brand-gold text-[11px] font-bold uppercase tracking-wide mb-1">
            {card.dateLabel}
          </p>
        )}
        <h3 className="text-white text-sm font-bold uppercase leading-tight">{card.title}</h3>
      </div>
    </Link>
  )
}

export function UpcomingEventsCarousel({ cards }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const stepSize = useCallback(() => {
    const el = trackRef.current
    if (!el) return 316
    const card = el.querySelector('[data-card]') as HTMLElement | null
    return card ? card.offsetWidth + 16 : 316
  }, [])

  const updateState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    setActiveIndex(Math.round(el.scrollLeft / stepSize()))
  }, [stepSize])

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
    trackRef.current?.scrollBy({ left: dir * stepSize(), behavior: 'smooth' })
  }

  return (
    <div>
      <div className="relative flex items-center gap-3">
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

        <div
          ref={trackRef}
          className="overflow-x-auto flex-1 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-4">
            {cards.map((card) => (
              <EventCard key={card.id} card={card} />
            ))}
          </div>
        </div>

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
      </div>

      {cards.length > 1 && (
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
