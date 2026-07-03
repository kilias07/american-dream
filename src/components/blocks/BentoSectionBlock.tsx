import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Media } from '@/payload-types'

type BentoItem = {
  image: Media | number | null
  colSpan: 'half' | 'full'
  label?: string | null
  title: string
  ctaLabel?: string | null
  ctaUrl?: string | null
}

type Props = {
  subheading?: string | null
  heading?: string | null
  description?: string | null
  items: BentoItem[]
}

function isMedia(value: Media | number | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

/** Small glyph for the CTA, derived from where the card links to. */
function CtaIcon({ url }: { url: string }) {
  const u = url.toLowerCase()
  const cls = 'w-4 h-4 flex-shrink-0'
  if (u.includes('bar') || u.includes('cocktail') || u.includes('koktajl')) {
    // Cocktail (coupe) glass
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 4h18l-8 8.6V19h3.5v2h-9v-2H11v-6.4L3 4Zm3.6 2L12 10.4 17.4 6H6.6Z" />
      </svg>
    )
  }
  if (u.includes('restaurant') || u.includes('restauracja')) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 2v7a2 2 0 0 0 2 2v11h2V11a2 2 0 0 0 2-2V2h-1.5v6H10V2H8.5v6H7V2Zm10 0c-1.7 0-3 2-3 5s1 4 2 4v9h2V2Z" />
      </svg>
    )
  }
  if (u.includes('cigar')) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M2 14h16v4H2v-4Zm17 0h2v4h-2v-4Zm-3-7c0-1.5 1-2 1-3M13 8c0-1.5 1-2 1-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    )
  }
  if (u.includes('event') || u.includes('program') || u.includes('wydarzen')) {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    )
  }
  return null
}

function BentoCard({ item }: { item: BentoItem }) {
  const media = isMedia(item.image) ? item.image : null

  return (
    <div
      className={`relative rounded-2xl overflow-hidden group cursor-pointer ring-1 ring-brand-gold/70 ${
        item.colSpan === 'full'
          ? 'col-span-2 aspect-[4/3] md:aspect-[3/2]'
          : 'col-span-2 md:col-span-1 min-h-[320px]'
      }`}
    >
      {/* Background image */}
      {media?.url ? (
        <Image
          src={media.url}
          alt={media.alt || item.title}
          fill
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          sizes={item.colSpan === 'full' ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
        />
      ) : (
        /* Brand gradient fallback — replaced by a real photo via CMS */
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1040] via-brand-navy-royal to-brand-navy" />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/40 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center">
        {item.label && (
          <p className="text-white/80 text-sm mb-2 max-w-xs leading-snug">{item.label}</p>
        )}

        <h3 className="text-white text-2xl md:text-3xl font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
          {item.title}
          <span className="text-white">›</span>
        </h3>

        {item.ctaLabel && item.ctaUrl && (
          <Link
            href={item.ctaUrl}
            className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[11px] font-bold uppercase tracking-[0.12em] px-6 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors"
          >
            <CtaIcon url={item.ctaUrl} />
            {item.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  )
}

export function BentoSectionBlock({ subheading, heading, description, items }: Props) {
  if (!items?.length) return null

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Section header */}
        {(subheading || heading || description) && (
          <div className="mb-8">
            {subheading && (
              <p className="text-white/60 text-sm md:text-base mb-1">{subheading}</p>
            )}
            {heading && (
              <h2 className="text-white text-3xl md:text-4xl font-bold uppercase tracking-tight mb-3">
                {heading}
              </h2>
            )}
            {description && (
              <p className="text-white/70 text-sm md:text-base max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Bento grid */}
        <div className="grid grid-cols-2 gap-4">
          {items.map((item, i) => (
            <BentoCard key={i} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
