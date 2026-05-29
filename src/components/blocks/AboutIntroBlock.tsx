import React from 'react'
import type { AboutIntroBlock as AboutIntroBlockType } from '@/payload-types'

export function AboutIntroBlock({
  block,
}: {
  block: AboutIntroBlockType
  locale: string
}) {
  const { eyebrow, heading, subheading, body, pullQuote } = block

  if (!eyebrow && !heading && !subheading && !body && !pullQuote) return null

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center">
          {eyebrow && (
            <p className="text-brand-gold text-xs md:text-sm font-bold uppercase tracking-[0.18em] mb-4">
              {eyebrow}
            </p>
          )}

          {heading && (
            <h2 className="font-serif text-white text-3xl md:text-5xl leading-tight mb-4">
              {heading}
            </h2>
          )}

          {subheading && (
            <p className="text-white/80 text-lg md:text-xl mb-6">{subheading}</p>
          )}

          {body && (
            <p className="text-white/70 text-base md:text-lg leading-relaxed">{body}</p>
          )}

          {pullQuote && (
            <p className="font-serif italic text-brand-gold text-xl md:text-2xl mt-8 leading-relaxed">
              {pullQuote}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
