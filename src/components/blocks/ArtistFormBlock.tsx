import React from 'react'
import { ArtistApplicationForm } from '@/components/forms/ArtistApplicationForm'
import type { ArtistFormBlock as ArtistFormBlockType } from '@/payload-types'

export function ArtistFormBlock({ block }: { block: ArtistFormBlockType; locale: string }) {
  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {(block.eyebrow || block.heading || block.intro) && (
          <div className="mb-8 max-w-3xl">
            {block.eyebrow && (
              <p className="text-brand-gold text-sm font-semibold uppercase tracking-[0.2em] mb-2">
                {block.eyebrow}
              </p>
            )}
            {block.heading && (
              <h2 className="font-serif text-white text-3xl md:text-5xl leading-tight mb-3">
                {block.heading}
              </h2>
            )}
            {block.intro && <p className="text-white/70 leading-relaxed">{block.intro}</p>}
          </div>
        )}
        <ArtistApplicationForm />
      </div>
    </section>
  )
}
