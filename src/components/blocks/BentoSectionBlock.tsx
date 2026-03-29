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

function BentoCard({ item }: { item: BentoItem }) {
  const media = isMedia(item.image) ? item.image : null

  return (
    <div
      className={`relative rounded-2xl overflow-hidden group cursor-pointer ${
        item.colSpan === 'full' ? 'col-span-2' : 'col-span-2 md:col-span-1'
      }`}
      style={{ minHeight: item.colSpan === 'full' ? 420 : 320 }}
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
        <div className="absolute inset-0 bg-brand-navy" />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/40 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center">
        {item.label && (
          <p className="text-white/80 text-sm mb-2 max-w-xs leading-snug">{item.label}</p>
        )}

        <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
          {item.title}
          <span className="text-white/70">›</span>
        </h3>

        {item.ctaLabel && item.ctaUrl && (
          <Link
            href={item.ctaUrl}
            className="inline-flex items-center gap-2 border border-white text-white text-[11px] font-bold uppercase tracking-[0.12em] px-5 py-2 rounded-full hover:bg-white hover:text-brand-navy transition-colors"
          >
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
