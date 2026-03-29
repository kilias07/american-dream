'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { EventOccurrence } from '@/lib/recurring-events'
import { getDayAbbr } from '@/lib/recurring-events'

type Props = {
  occurrences: EventOccurrence[]
  heading?: string | null
  ctaLabel?: string | null
  ctaUrl?: string | null
  locale: string
  colorScheme?: 'gold' | 'white'
}

function EventCard({ occ, locale, featured }: { occ: EventOccurrence; locale: string; featured: boolean }) {
  const date = new Date(occ.dateISO)
  const dayAbbr = getDayAbbr(date, locale)
  const dayNum = String(date.getDate()).padStart(2, '0')

  const startTime = date.toLocaleTimeString(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <div
      data-card
      className={`relative flex-shrink-0 w-[63vw] sm:w-[220px] rounded-2xl overflow-hidden bg-brand-navy cursor-pointer group ${featured ? 'ring-2 ring-brand-gold' : ''}`}
      style={{ minHeight: 280 }}
    >
      {occ.image?.url ? (
        <Image
          src={occ.image.url}
          alt={occ.image.alt || occ.title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 75vw, 220px"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy/80" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-brand-navy/30" />

      <div className="absolute top-3 left-3 bg-[#1B6EC2] text-white text-center rounded-md px-2 py-1 leading-none z-10">
        <div className="text-[10px] font-bold uppercase tracking-wider">{dayAbbr}</div>
        <div className="text-[22px] font-bold leading-none">{dayNum}</div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h3 className="text-white font-bold text-[13px] uppercase leading-tight mb-2">
          {occ.title}
          {' '}
          <span className="inline-block text-white/70">›</span>
        </h3>

        <div className="flex items-center gap-3 text-white/80 text-[11px] mb-2">
          {(startTime || occ.endTime) && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
              </svg>
              {startTime}{occ.endTime ? ` - ${occ.endTime}` : ''}
            </span>
          )}
          {occ.price != null && (
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
              </svg>
              {occ.price} PLN
            </span>
          )}
        </div>

        {featured && occ.ticketUrl && (
          <Link
            href={occ.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 bg-brand-gold text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full hover:bg-brand-gold-dark transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2z" />
            </svg>
            {locale === 'pl' ? 'Bilety' : 'Tickets'}
          </Link>
        )}
      </div>
    </div>
  )
}

export function EventsTeaserBlock({ occurrences, heading, ctaLabel, ctaUrl, locale, colorScheme = 'gold' }: Props) {
  const isGold = colorScheme === 'gold'
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
    const step = card ? card.offsetWidth + 12 : 232
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  if (occurrences.length === 0) return null

  const lineColor = isGold ? 'rgba(255,255,255,0.18)' : 'rgba(10,17,40,0.12)'

  return (
    <section className="relative overflow-hidden py-12">
      <div className="absolute inset-0" style={{ background: isGold ? '#FF9E0D' : '#ffffff' }} />

      {/* Curtain lines — white variant only */}
      {!isGold && (
        <>
          <svg
            className="absolute left-0 top-0 h-full pointer-events-none"
            width="160"
            viewBox="0 0 160 600"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 6 0 C 14 150, 4 300, 10 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 24 0 C 36 150, 22 300, 30 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 46 0 C 60 150, 44 300, 52 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 70 0 C 86 150, 68 300, 76 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 96 0 C 108 150, 94 300, 100 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 122 0 C 136 150, 120 300, 128 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 148 0 C 160 150, 146 300, 154 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
          </svg>

          <svg
            className="absolute right-0 top-0 h-full pointer-events-none"
            width="160"
            viewBox="0 0 160 600"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M 154 0 C 146 150, 156 300, 150 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 136 0 C 124 150, 138 300, 130 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 114 0 C 100 150, 116 300, 108 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 90 0 C 74 150, 92 300, 84 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 64 0 C 48 150, 66 300, 58 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 38 0 C 24 150, 40 300, 32 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
            <path d="M 12 0 C 0 150, 14 300, 6 600" stroke={lineColor} strokeWidth="1.2" fill="none" />
          </svg>
        </>
      )}

      {/* Heading — inside container */}
      <div className="relative w-full max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-brand-navy text-2xl md:text-3xl font-bold uppercase tracking-tight">
              {heading || (locale === 'pl' ? 'Nadchodzące wydarzenia' : 'Upcoming events')}
            </h2>
            <span className="text-brand-navy text-2xl font-bold">›</span>
          </div>

          {ctaLabel && ctaUrl && (
            <Link
              href={ctaUrl}
              className={`hidden md:flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded-full transition-colors whitespace-nowrap ${isGold ? 'bg-brand-navy text-white hover:bg-brand-navy/80' : 'bg-brand-gold text-white hover:bg-brand-gold/80'}`}
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>

      {/* Carousel — max 1280px centered */}
      <div className="relative flex items-center justify-center gap-3 w-full max-w-[1280px] mx-auto px-4 md:px-6">
        {/* Arrows — desktop only */}
        <button
          onClick={() => scroll(-1)}
          disabled={!canPrev}
          className="hidden md:flex flex-shrink-0 w-11 h-11 rounded-full border-2 border-brand-navy bg-transparent disabled:opacity-30 disabled:cursor-not-allowed items-center justify-center transition-colors hover:bg-brand-navy/10 text-brand-navy"
          aria-label="Previous"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Scrollable track */}
        <div
          ref={trackRef}
          className="overflow-x-auto flex-1 pl-4 md:pl-0 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-3 w-fit mx-auto">
            {occurrences.map((occ, i) => (
              <EventCard
                key={`${occ.id}-${occ.dateISO}`}
                occ={occ}
                locale={locale}
                featured={i === 0}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => scroll(1)}
          disabled={!canNext}
          className="hidden md:flex flex-shrink-0 w-11 h-11 rounded-full border-2 border-brand-navy bg-transparent disabled:opacity-30 disabled:cursor-not-allowed items-center justify-center transition-colors hover:bg-brand-navy/10 text-brand-navy"
          aria-label="Next"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {ctaLabel && ctaUrl && (
        <div className="mt-6 flex justify-center w-full max-w-[1280px] mx-auto px-6 md:hidden">
          <Link
            href={ctaUrl}
            className={`inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded-full ${isGold ? 'bg-brand-navy text-white' : 'bg-brand-gold text-white'}`}
          >
            {ctaLabel}
          </Link>
        </div>
      )}
    </section>
  )
}
