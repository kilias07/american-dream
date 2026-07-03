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
        <div className="max-w-4xl mx-auto text-center">
          {eyebrow && (
            <p className="font-serif text-white text-2xl md:text-[32px] leading-tight mb-3">
              {eyebrow}
            </p>
          )}

          {heading && (
            <h2 className="text-white font-semibold text-base md:text-lg tracking-[0.04em] mb-6">
              {heading}
            </h2>
          )}

          {subheading && (
            <p className="text-white/80 text-lg md:text-xl mb-6">{subheading}</p>
          )}

          {body && (
            <p className="text-white/90 text-sm md:text-base leading-relaxed">{body}</p>
          )}

          {pullQuote && (
            <p className="font-serif italic text-white text-xl md:text-2xl mt-6 leading-relaxed">
              &ldquo;{pullQuote}&rdquo;
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
