import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { OfferCardsBlock as OfferCardsBlockType, Media } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'

type OfferCard = NonNullable<OfferCardsBlockType['cards']>[number]

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

/**
 * Where a card button points. An uploaded file (typically a PDF offer) wins
 * over the typed address, so an editor who picks a file doesn't also have to
 * paste its URL. Internal paths get the locale prefix; `tel:`/`mailto:`/`https:`
 * are passed through untouched.
 */
function resolveCtaHref(
  url: string | null | undefined,
  file: number | Media | null | undefined,
  locale: string,
): { href: string; isFile: boolean } | null {
  if (isMedia(file) && file.url) return { href: file.url, isFile: true }
  if (!url) return null
  return { href: url.startsWith('/') ? localeHref(locale as Locale, url) : url, isFile: false }
}

/** Outline twin of the gold CTA — the optional second button on a card. */
function SecondaryCta({
  label,
  target,
  className = '',
}: {
  label: string
  target: { href: string; isFile: boolean }
  className?: string
}) {
  return (
    <Link
      href={target.href}
      {...(target.isFile ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`inline-flex items-center gap-2 border border-brand-gold text-brand-gold text-[12px] font-bold uppercase tracking-[0.12em] rounded-full hover:bg-brand-gold hover:text-brand-navy transition-colors ${className}`}
    >
      {label}
    </Link>
  )
}

function OfferCard({ card, locale }: { card: OfferCard; locale: string }) {
  const media = isMedia(card.image) ? card.image : null
  const ctaHref = resolveCtaHref(card.ctaUrl, null, locale)?.href ?? null
  const secondaryCta = resolveCtaHref(card.secondaryCtaUrl, card.secondaryCtaFile, locale)

  return (
    /* Złota ramka jak na banerach bento + treść wyśrodkowana w pionie i poziomie
       (uwaga klienta 2026-07: „dodać ramki wokół banerów… teksty i przycisk
       wyśrodkowane w pionie i poziomie"); wielkość kart bez zmian. */
    /* minHeight, nie height: karta rośnie pod treść, bo opisy bywają długie
       i na wąskim ekranie wychodziły poza kadr (uwaga klienta 2026-08). */
    <div
      className="relative rounded-2xl overflow-hidden ring-1 ring-brand-gold/70 group flex items-center justify-center min-h-[380px]"
    >
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

      {/* Navy gradient overlay — mocniejszy środek pod wyśrodkowaną treść */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/60 to-brand-navy/25" />

      {/* Tag */}
      {card.tag && (
        <span className="absolute top-5 left-5 z-10 bg-brand-gold text-brand-navy text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full">
          {card.tag}
        </span>
      )}

      {/* Content — wyśrodkowana w pionie i poziomie, w normalnym przepływie */}
      <div className="relative z-10 w-full p-6 md:p-8 flex flex-col items-center justify-center text-center">
        {card.title && (
          <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wide mb-3">
            {card.title}
          </h3>
        )}

        {card.body && (
          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-5 max-w-md">{card.body}</p>
        )}

        {/* One or two buttons, wrapping on narrow cards */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {card.ctaLabel && ctaHref && (
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors"
            >
              {card.ctaLabel}
            </Link>
          )}
          {card.secondaryCtaLabel && secondaryCta && (
            <SecondaryCta
              label={card.secondaryCtaLabel}
              target={secondaryCta}
              className="px-5 py-2.5"
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Framed variant — used on the "Twoje wydarzenie" page. A full-bleed background
// photo inside a thin gold frame, with a navy gradient and centred copy + CTA.
function FramedOfferCard({ card, locale }: { card: OfferCard; locale: string }) {
  const media = isMedia(card.image) ? card.image : null
  const ctaHref = resolveCtaHref(card.ctaUrl, null, locale)?.href ?? null
  const secondaryCta = resolveCtaHref(card.secondaryCtaUrl, card.secondaryCtaFile, locale)

  return (
    <div className="relative rounded-2xl overflow-hidden border border-brand-gold/50 group flex items-end min-h-[460px]">
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

      {/* Navy gradient overlay — heavier at the bottom where the copy sits */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/85 to-brand-navy/25" />

      {/* Content — centred at the bottom, in flow so the card can grow */}
      <div className="relative z-10 w-full p-6 md:p-8 flex flex-col items-center text-center">
        {card.tag && (
          <p className="text-brand-gold text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] mb-3">
            {card.tag}
          </p>
        )}
        {card.title && (
          <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wide mb-4 max-w-md">
            {card.title}
          </h3>
        )}
        {card.body && (
          <p className="text-white/80 text-sm md:text-[15px] leading-relaxed mb-6 max-w-md">
            {card.body}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {card.ctaLabel && ctaHref && (
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-6 py-3 rounded-full hover:bg-brand-gold-dark transition-colors"
            >
              {card.ctaLabel}
            </Link>
          )}
          {card.secondaryCtaLabel && secondaryCta && (
            <SecondaryCta
              label={card.secondaryCtaLabel}
              target={secondaryCta}
              className="px-6 py-3"
            />
          )}
        </div>
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
  const { eyebrow, heading, cards, style } = block
  const framed = style === 'framed'

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
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-stretch">
          {cards.map((card, i) =>
            framed ? (
              <FramedOfferCard key={card.id || i} card={card} locale={locale} />
            ) : (
              <OfferCard key={card.id || i} card={card} locale={locale} />
            ),
          )}
        </div>
      </div>
    </section>
  )
}
