'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export type MusicianCardData = {
  id: number
  name: string
  instrument: string | null
  slug: string | null
  image: { url: string; alt: string } | null
}

type Props = {
  cards: MusicianCardData[]
  locale: string
}

function MusicianCard({ card, locale }: { card: MusicianCardData; locale: string }) {
  const href = card.slug ? `/${locale}/muzycy/${card.slug}` : null

  const inner = (
    <div className="group">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-brand-navy-royal mb-3">
        {card.image?.url ? (
          <Image
            src={card.image.url}
            alt={card.image.alt || card.name}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 46vw, 240px"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-navy" />
        )}
        {href && (
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <h3 className="text-white text-base font-bold uppercase tracking-wide leading-tight">
        {card.name}
      </h3>
      {card.instrument && (
        <p className="text-brand-gold text-[11px] font-bold uppercase tracking-[0.12em] mt-1">
          {card.instrument}
        </p>
      )}
    </div>
  )

  return (
    <div data-card className="flex-shrink-0 w-[46vw] sm:w-[210px] lg:w-[240px]">
      {href ? (
        <Link
          href={href}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold rounded-2xl"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  )
}

export function MusiciansCarouselClient({ cards, locale }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [activePage, setActivePage] = useState(0)
  const [pageCount, setPageCount] = useState(1)

  const updateState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft < maxScroll - 4)
    // Paginacja jest stronicowa: jedna kropka = jeden ekran (clientWidth).
    // Liczba stron wynika z faktycznej przewijalnej szerokości, więc każda
    // kropka jest osiągalna — także ostatnia, gdy ostatni ekran pokazuje
    // kilka kart naraz (poprzednio kropek było tyle co kart i ostatnie nigdy
    // się nie aktywowały).
    const step = el.clientWidth || 1
    const pages = maxScroll > 4 ? Math.round(maxScroll / step) + 1 : 1
    setPageCount(pages)
    setActivePage(Math.min(pages - 1, Math.max(0, Math.round(el.scrollLeft / step))))
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

  const scrollToPage = (page: number) => {
    const el = trackRef.current
    if (!el) return
    const step = el.clientWidth
    const maxScroll = el.scrollWidth - el.clientWidth
    el.scrollTo({ left: Math.min(page * step, maxScroll), behavior: 'smooth' })
  }

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
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
              <MusicianCard key={card.id} card={card} locale={locale} />
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

      {pageCount > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToPage(i)}
              aria-label={`Przejdź do strony ${i + 1}`}
              aria-current={i === activePage}
              className={`h-2 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                i === activePage ? 'w-6 bg-brand-gold' : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
