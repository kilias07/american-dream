'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getDayAbbr, formatTime, warsawDayKey } from '@/lib/recurring-events'
import { ReserveTrigger } from '@/components/reservations/MyRest'

export type SpecialContact = {
  phone: string
  email: string
  address: string
}

export type SpecialEventCard = {
  id: number
  slug: string | null
  title: string
  leadTitle: string | null
  performers: { name: string; instrument: string | null }[]
  dateISO: string | null
  endTime: string | null
  price: number | null
  image: { url: string; alt: string } | null
}

type Props = {
  cards: SpecialEventCard[]
  contact: SpecialContact
  locale: string
}

function monthAbbr(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'pl' ? 'pl-PL' : 'en-GB', {
    month: 'short',
    timeZone: 'Europe/Warsaw',
  })
    .format(new Date(iso))
    .replace('.', '')
    .toUpperCase()
}

function PosterCard({
  card,
  contact,
  locale,
}: {
  card: SpecialEventCard
  contact: SpecialContact
  locale: string
}) {
  const reserveLabel = locale === 'pl' ? 'Zarezerwuj stolik' : 'Reserve a table'
  const startTime = card.dateISO ? formatTime(card.dateISO) : ''
  const dayNum = card.dateISO ? warsawDayKey(card.dateISO).slice(-2) : ''
  const dayAbbr = card.dateISO ? getDayAbbr(new Date(card.dateISO), locale) : ''
  const mon = card.dateISO ? monthAbbr(card.dateISO, locale) : ''

  return (
    <div
      data-card
      className="relative flex-shrink-0 w-[82vw] sm:w-[420px] snap-start rounded-2xl overflow-hidden bg-[#0d0a24] ring-1 ring-brand-gold/50 flex flex-col"
      style={{ minHeight: 600 }}
    >
      {/* Poster artwork */}
      <div className="relative flex-1 min-h-0">
        {card.image?.url ? (
          <Image
            src={card.image.url}
            alt={card.image.alt || card.title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 82vw, 420px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#170D35] to-[#0e1a4a]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,rgba(248,171,0,0.14),transparent)]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a24] via-[#0d0a24]/35 to-transparent" />

        {/* Title + performers overlay (legible over any poster) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pr-20">
          {card.leadTitle && (
            <p className="text-brand-gold text-[10px] font-bold uppercase tracking-[0.18em] mb-1">
              {card.leadTitle}
            </p>
          )}
          <h3 className="text-white font-serif text-2xl leading-tight">{card.title}</h3>
          {card.performers.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {card.performers.slice(0, 4).map((p, i) => (
                <li key={i} className="text-white/80 text-[12px] leading-tight">
                  <span className="font-bold uppercase tracking-wide">{p.name}</span>
                  {p.instrument && <span className="text-white/55"> — {p.instrument}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Date / time badge on the right edge */}
        {card.dateISO && (
          <div className="absolute bottom-4 right-3 flex flex-col items-stretch w-14 text-center overflow-hidden rounded-md shadow-lg">
            <div className="bg-[#9e1b2f] text-white py-1.5 leading-none">
              <div className="text-[9px] font-bold uppercase tracking-wider">{dayAbbr}</div>
              <div className="text-[20px] font-black leading-none my-0.5">{dayNum}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider">{mon}</div>
            </div>
            {startTime && (
              <div className="bg-brand-gold text-brand-navy text-[12px] font-bold py-1">{startTime}</div>
            )}
          </div>
        )}
      </div>

      {/* Bottom band: reserve CTA + contact line */}
      <div className="bg-[#0a0820] px-3 py-3">
        <ReserveTrigger
          date={card.dateISO}
          className="flex w-full items-center justify-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z" />
          </svg>
          {reserveLabel}
        </ReserveTrigger>
        <p className="mt-2 text-white/45 text-[10px] leading-snug text-center">
          {card.price != null && <span className="text-white/70 font-bold">{card.price} zł · </span>}
          {contact.phone} · {contact.email}
          <br />
          {contact.address}
        </p>
      </div>
    </div>
  )
}

export function SpecialEventsClient({ cards, contact, locale }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  const stepSize = useCallback(() => {
    const el = trackRef.current
    if (!el) return 436
    const card = el.querySelector('[data-card]') as HTMLElement | null
    return card ? card.offsetWidth + 16 : 436
  }, [])

  const updateState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const step = stepSize()
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft < maxScroll - 4)
    const pages = maxScroll <= 4 ? 1 : Math.ceil(maxScroll / step) + 1
    setPageCount(pages)
    setActiveIndex(Math.min(pages - 1, Math.round(el.scrollLeft / step)))
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
  const goToPage = (i: number) => {
    const el = trackRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    el.scrollTo({ left: Math.min(i * stepSize(), maxScroll), behavior: 'smooth' })
  }

  const showNav = pageCount > 1

  return (
    <div>
      <div className="relative flex items-stretch gap-3">
        {showNav && (
          <button
            onClick={() => scroll(-1)}
            disabled={!canPrev}
            className="hidden md:flex flex-shrink-0 w-11 h-11 self-center rounded-full border-2 border-white/60 bg-transparent disabled:opacity-30 items-center justify-center transition-colors hover:bg-white/10 text-white"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div
          ref={trackRef}
          className="overflow-x-auto flex-1 pb-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex gap-4 items-stretch">
            {cards.map((card) => (
              <PosterCard key={card.id} card={card} contact={contact} locale={locale} />
            ))}
          </div>
        </div>

        {showNav && (
          <button
            onClick={() => scroll(1)}
            disabled={!canNext}
            className="hidden md:flex flex-shrink-0 w-11 h-11 self-center rounded-full border-2 border-white/60 bg-transparent disabled:opacity-30 items-center justify-center transition-colors hover:bg-white/10 text-white"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {showNav && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToPage(i)}
              aria-label={`${locale === 'pl' ? 'Pozycja' : 'Slide'} ${i + 1}`}
              aria-current={i === activeIndex}
              className={`h-2 rounded-full transition-all ${i === activeIndex ? 'w-6 bg-brand-gold' : 'w-2 bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
