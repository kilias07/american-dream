'use client'

import React, { useState } from 'react'
import type { Page } from '@/payload-types'

type TestimonialsData = Extract<NonNullable<Page['layout']>[number], { blockType: 'testimonials' }>
type Item = NonNullable<TestimonialsData['items']>[number]

const ITEMS_PER_PAGE = 4

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < count ? 'text-amber-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function TestimonialCard({ item }: { item: Item }) {
  return (
    <div className="relative bg-white rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col gap-3">
      {/* Decorative opening quote */}
      <span className="absolute top-4 left-4 text-7xl font-serif leading-none text-gray-200 select-none">
        &ldquo;
      </span>
      {/* Name + stars */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <span className="font-bold text-brand-navy text-sm">{item.name}</span>
        <StarRating count={item.stars ?? 5} />
      </div>
      {/* Text */}
      <p className="text-brand-navy text-sm leading-relaxed relative z-10">{item.text}</p>
      {/* Decorative closing quote */}
      <span className="absolute bottom-2 right-4 text-7xl font-serif leading-none text-gray-200 select-none">
        &rdquo;
      </span>
    </div>
  )
}

function GoogleLogo() {
  return (
    <span className="font-bold text-xl tracking-tight" aria-label="Google">
      <span style={{ color: '#4285F4' }}>G</span>
      <span style={{ color: '#EA4335' }}>o</span>
      <span style={{ color: '#FBBC05' }}>o</span>
      <span style={{ color: '#4285F4' }}>g</span>
      <span style={{ color: '#34A853' }}>l</span>
      <span style={{ color: '#EA4335' }}>e</span>
    </span>
  )
}

export function TestimonialsBlock({ block }: { block: TestimonialsData }) {
  const { heading, reviewSummary, items } = block
  const allItems = items ?? []
  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE)
  const [page, setPage] = useState(0)

  const visible = allItems.slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE)

  return (
    <section className="bg-brand-navy py-16 px-6 md:px-10">
      <div className="container max-w-[1280px] mx-auto">
        {/* Heading */}
        {heading && (
          <h2 className="text-white text-xl font-bold uppercase tracking-widest mb-8">
            {heading}
          </h2>
        )}

        {/* Google review summary */}
        {reviewSummary && (
          <div className="flex items-center justify-center gap-3 mb-10 text-white text-lg">
            <span>{reviewSummary}</span>
            <GoogleLogo />
          </div>
        )}

        {/* Carousel wrapper */}
        <div className="relative">
          {/* Prev arrow */}
          {totalPages > 1 && (
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="absolute -left-10 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition z-10"
              aria-label="Previous"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visible.map((item, i) => (
              <TestimonialCard key={i} item={item} />
            ))}
          </div>

          {/* Next arrow */}
          {totalPages > 1 && (
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="absolute -right-10 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 transition z-10"
              aria-label="Next"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === page ? 'bg-white scale-125' : 'bg-white/30'
                }`}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
