'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export type NewsCard = {
  id: number
  title: string
  excerpt: string | null
  slug: string
  image: { url: string; alt: string } | null
}

type Props = {
  cards: NewsCard[]
  locale: string
}

function ArticleCard({ card, locale }: { card: NewsCard; locale: string }) {
  const href = `/${locale}/aktualnosci/${card.slug}`
  const readMore = locale === 'pl' ? 'Czytaj więcej…' : 'Read more…'

  return (
    <div
      data-card
      className="relative flex-shrink-0 w-[80vw] sm:w-[360px] rounded-2xl overflow-hidden bg-brand-navy-royal group"
      style={{ minHeight: 380 }}
    >
      {card.image?.url ? (
        <Image
          src={card.image.url}
          alt={card.image.alt || card.title}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 80vw, 360px"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy-royal" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/20" />

      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <h3 className="text-white font-bold text-lg uppercase tracking-wide leading-tight mb-2">
          {card.title}
        </h3>
        {card.excerpt && (
          <p className="text-white/70 text-sm leading-snug mb-4 line-clamp-3">{card.excerpt}</p>
        )}
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-brand-gold text-[12px] font-bold uppercase tracking-[0.12em] hover:text-brand-gold-dark transition-colors"
        >
          {readMore}
          <span aria-hidden="true">›</span>
        </Link>
      </div>
    </div>
  )
}

export function NewsCarouselClient({ cards, locale }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const updateState = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    const card = el.querySelector('[data-card]') as HTMLElement | null
    const step = card ? card.offsetWidth + 16 : 376
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
    const step = card ? card.offsetWidth + 16 : 376
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
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
              <ArticleCard key={card.id} card={card} locale={locale} />
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
