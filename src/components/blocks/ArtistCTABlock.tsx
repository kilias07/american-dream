import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ArtistCtaBlock as ArtistCTABlockType, Media } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

export function ArtistCTABlock({
  block,
  locale,
}: {
  block: ArtistCTABlockType
  locale: string
}) {
  const { eyebrow, heading, backgroundImage, ctaLabel, ctaUrl } = block

  if (!eyebrow && !heading && !ctaLabel) return null

  const image = isMedia(backgroundImage) ? backgroundImage : null
  const ctaHref = ctaUrl
    ? ctaUrl.startsWith('/')
      ? localeHref(locale as Locale, ctaUrl)
      : ctaUrl
    : null

  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      {image?.url ? (
        <Image
          src={image.url}
          alt={image.alt || heading || ''}
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy" />
      )}

      {/* Navy overlay */}
      <div className="absolute inset-0 bg-brand-navy/75" />

      {/* Content */}
      <div className="relative z-10 container max-w-[1280px] mx-auto px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
          {eyebrow && (
            <p className="text-white/80 text-xs md:text-sm font-bold uppercase tracking-[0.18em]">
              {eyebrow}
            </p>
          )}

          {heading && (
            <h2 className="font-serif text-white text-3xl md:text-4xl leading-tight">{heading}</h2>
          )}

          {ctaLabel && ctaHref && (
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors"
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
