import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { PromoBandBlock as PromoBandBlockType, Media } from '@/payload-types'
import { ReserveTrigger } from '@/components/reservations/MyRest'
import { isReservationUrl } from '@/lib/reservation-url'

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

export function PromoBandBlock({
  block,
  locale,
}: {
  block: PromoBandBlockType
  locale: string
}) {
  const { heading, subtitle, body, image, items, ctaLabel, ctaUrl, style } = block

  if (!heading && !body && !items?.length && !ctaLabel) return null

  const isGold = style === 'gold'
  const media = isMedia(image) ? image : null
  const ctaHref = ctaUrl
    ? ctaUrl.startsWith('/')
      ? `/${locale}${ctaUrl}`
      : ctaUrl
    : null

  return (
    <section
      className={`py-12 md:py-16 ${isGold ? 'bg-brand-gold text-brand-navy' : 'bg-brand-navy text-white'}`}
    >
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: image */}
          {media?.url && (
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src={media.url}
                alt={media.alt || heading || ''}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}

          {/* Right: content */}
          <div className={media?.url ? '' : 'md:col-span-2 max-w-2xl'}>
            {heading && (
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-4">{heading}</h2>
            )}

            {subtitle && (
              <p
                className={`text-sm font-bold uppercase tracking-[0.12em] mb-4 ${
                  isGold ? 'text-brand-navy/70' : 'text-brand-gold'
                }`}
              >
                {subtitle}
              </p>
            )}

            {body && (
              <p
                className={`text-base md:text-lg leading-relaxed mb-6 ${
                  isGold ? 'text-brand-navy/80' : 'text-white/70'
                }`}
              >
                {body}
              </p>
            )}

            {items && items.length > 0 && (
              <ul className="flex flex-col divide-y divide-current/15 mb-8">
                {items.map((item, i) => (
                  <li key={item.id || i} className="flex items-center gap-4 py-3">
                    <div className="flex-1">
                      {item.label && <p className="font-bold">{item.label}</p>}
                      {item.sub && (
                        <p
                          className={`text-sm ${isGold ? 'text-brand-navy/60' : 'text-white/60'}`}
                        >
                          {item.sub}
                        </p>
                      )}
                    </div>
                    {typeof item.price === 'number' && (
                      <span
                        className={`flex-shrink-0 text-sm font-bold px-3 py-1 rounded-full ${
                          isGold ? 'bg-brand-navy text-brand-gold' : 'bg-brand-gold text-brand-navy'
                        }`}
                      >
                        {item.price} zł
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {ctaLabel &&
              ctaHref &&
              (() => {
                const ctaClass = `inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full transition-colors ${
                  isGold
                    ? 'bg-brand-navy text-white hover:bg-brand-navy-royal'
                    : 'bg-brand-gold text-brand-navy hover:bg-brand-gold-dark'
                }`
                // Reservation CTAs open the MyRest widget; other links navigate normally.
                return isReservationUrl(ctaUrl) ? (
                  <ReserveTrigger className={ctaClass}>{ctaLabel}</ReserveTrigger>
                ) : (
                  <Link href={ctaHref} className={ctaClass}>
                    {ctaLabel}
                  </Link>
                )
              })()}
          </div>
        </div>
      </div>
    </section>
  )
}
