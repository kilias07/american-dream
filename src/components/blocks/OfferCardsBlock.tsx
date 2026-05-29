import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { OfferCardsBlock as OfferCardsBlockType, Media } from '@/payload-types'

type OfferCard = NonNullable<OfferCardsBlockType['cards']>[number]

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

function OfferCard({ card, locale }: { card: OfferCard; locale: string }) {
  const media = isMedia(card.image) ? card.image : null
  const ctaHref = card.ctaUrl
    ? card.ctaUrl.startsWith('/')
      ? `/${locale}${card.ctaUrl}`
      : card.ctaUrl
    : null

  return (
    <div className="relative rounded-2xl overflow-hidden group" style={{ minHeight: 380 }}>
      {/* Background image */}
      {media?.url ? (
        <Image
          src={media.url}
          alt={media.alt || card.title || ''}
          fill
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy" />
      )}

      {/* Navy gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/95 via-brand-navy/50 to-brand-navy/20" />

      {/* Tag */}
      {card.tag && (
        <span className="absolute top-5 left-5 z-10 bg-brand-gold text-brand-navy text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full">
          {card.tag}
        </span>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col items-start">
        {card.title && (
          <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wide mb-3">
            {card.title}
          </h3>
        )}

        {card.body && (
          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-5">{card.body}</p>
        )}

        {card.ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors"
          >
            {card.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  )
}

export function OfferCardsBlock({
  block,
  locale,
}: {
  block: OfferCardsBlockType
  locale: string
}) {
  const { eyebrow, heading, cards } = block

  if (!cards?.length) return null

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Header */}
        {(eyebrow || heading) && (
          <div className="mb-8">
            {eyebrow && (
              <p className="text-brand-gold text-xs md:text-sm font-bold uppercase tracking-[0.18em] mb-2">
                {eyebrow}
              </p>
            )}
            {heading && (
              <h2 className="text-white text-3xl md:text-4xl font-bold uppercase tracking-tight">
                {heading}
              </h2>
            )}
          </div>
        )}

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {cards.map((card, i) => (
            <OfferCard key={card.id || i} card={card} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  )
}
