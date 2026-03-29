'use client'
import React, { useState } from 'react'
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
      className={`relative flex-shrink-0 w-[200px] md:w-[220px] rounded-2xl overflow-hidden bg-brand-navy cursor-pointer group transition-transform duration-200 hover:-translate-y-1 ${featured ? 'ring-2 ring-brand-gold' : ''}`}
      style={{ minHeight: 260 }}
    >
      {/* Background image */}
      {occ.image?.url ? (
        <Image
          src={occ.image.url}
          alt={occ.image.alt || occ.title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="220px"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy/80" />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-brand-navy/30" />

      {/* Day badge */}
      <div className="absolute top-3 left-3 bg-[#1B6EC2] text-white text-center rounded-md px-2 py-1 leading-none z-10">
        <div className="text-[10px] font-bold uppercase tracking-wider">{dayAbbr}</div>
        <div className="text-[22px] font-bold leading-none">{dayNum}</div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
        <h3 className="text-white font-bold text-[13px] uppercase leading-tight mb-2">
          {occ.title}
          {' '}
          <span className="inline-block text-white/70">›</span>
        </h3>

        {/* Time & price */}
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

        {/* Ticket button — shown on featured/first card */}
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

export function EventsTeaserBlock({ occurrences, heading, ctaLabel, ctaUrl, locale }: Props) {
  const [offset, setOffset] = useState(0)
  const visibleCount = 6
  const canPrev = offset > 0
  const canNext = offset + visibleCount < occurrences.length

  const visible = occurrences.slice(offset, offset + visibleCount + 2) // render a few extra for smooth scroll

  if (occurrences.length === 0) return null

  return (
    <section className="relative overflow-hidden py-12">
      {/* Gold background */}
      <div className="absolute inset-0 bg-brand-gold" />

      {/* Curtain — vertical lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.13) 0px, rgba(255,255,255,0.13) 1px, transparent 1px, transparent 38px)',
        }}
      />

      <div className="relative container">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-brand-navy text-2xl md:text-3xl font-black uppercase tracking-tight">
              {heading || (locale === 'pl' ? 'Nadchodzące wydarzenia' : 'Upcoming events')}
            </h2>
            <span className="text-brand-navy text-2xl font-bold">›</span>
          </div>

          {ctaLabel && ctaUrl && (
            <Link
              href={ctaUrl}
              className="hidden md:flex items-center gap-2 bg-brand-navy text-white text-[12px] font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded-full hover:bg-brand-navy/80 transition-colors whitespace-nowrap"
            >
              {ctaLabel}
            </Link>
          )}
        </div>

        {/* Carousel */}
        <div className="relative flex items-center gap-4">
          {/* Prev arrow */}
          <button
            onClick={() => setOffset(Math.max(0, offset - 1))}
            disabled={!canPrev}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-brand-navy transition-colors"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Cards */}
          <div className="flex gap-3 overflow-hidden flex-1">
            {occurrences.slice(offset, offset + 6).map((occ, i) => (
              <EventCard
                key={occ.id}
                occ={occ}
                locale={locale}
                featured={i === 0}
              />
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={() => setOffset(Math.min(occurrences.length - 1, offset + 1))}
            disabled={!canNext}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-brand-navy transition-colors"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Mobile CTA */}
        {ctaLabel && ctaUrl && (
          <div className="mt-6 flex justify-center md:hidden">
            <Link
              href={ctaUrl}
              className="inline-flex items-center gap-2 bg-brand-navy text-white text-[12px] font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded-full"
            >
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
