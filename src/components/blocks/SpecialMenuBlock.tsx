'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { SpecialMenuBlock as SpecialMenuBlockType, Media } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'
import { Lightbox } from '@/components/Lightbox'

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

export function SpecialMenuBlock({
  block,
  locale,
}: {
  block: SpecialMenuBlockType
  locale: string
}) {
  const { heading, subtitle, body, ctaLabel, ctaUrl } = block
  const image = isMedia(block.image) ? block.image : null
  const logo = isMedia(block.logo) ? block.logo : null
  const menuImage = isMedia(block.menuImage) ? block.menuImage : null

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (!heading && !menuImage) return null

  const ctaHref = ctaUrl
    ? ctaUrl.startsWith('/')
      ? localeHref(locale as Locale, ctaUrl)
      : ctaUrl
    : null
  const ctaClass =
    'inline-flex items-center justify-center gap-2 bg-white text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-7 py-3.5 rounded-full hover:bg-white/90 transition-colors'

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="rounded-3xl overflow-hidden bg-brand-gold text-brand-navy ring-1 ring-brand-gold-dark">
          {/* ── Banner: gold-duotone photo + logo/heading, intro and CTA ── */}
          <div className="relative">
            {image?.url && (
              <Image
                src={image.url}
                alt={image.alt || heading || ''}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1280px) 100vw, 1200px"
              />
            )}
            {/* Warm amber duotone: recolor to gold + a gold flood so the banner stays
                bright (design), then only a soft bottom-left navy wash for white copy. */}
            <div className="absolute inset-0 bg-brand-gold mix-blend-color" />
            <div className="absolute inset-0 bg-brand-gold/35" />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-navy/45 via-transparent to-transparent" />

            <div className="relative flex flex-col p-8 md:p-12">
              {/* Logo + intro grouped together, top-left (design). */}
              <div className="max-w-xl">
                {logo?.url ? (
                  <Image
                    src={logo.url}
                    alt={logo.alt || heading || ''}
                    width={logo.width || 360}
                    height={logo.height || 160}
                    className="h-auto w-56 md:w-72"
                  />
                ) : (
                  heading && (
                    <h2 className="font-serif italic text-brand-navy text-5xl md:text-6xl leading-[0.95] drop-shadow-sm">
                      {heading}
                    </h2>
                  )
                )}

                {subtitle && (
                  <p className="text-white text-lg md:text-xl font-semibold mt-8 drop-shadow">{subtitle}</p>
                )}
                {body && (
                  <p className="text-white/90 text-sm md:text-base leading-relaxed mt-4 drop-shadow">
                    {body}
                  </p>
                )}
              </div>

              {/* CTA — lower-right over the photo on desktop, stacked on mobile. */}
              {ctaLabel && (
                <div className="mt-8 md:mt-0 md:absolute md:right-12 md:bottom-12">
                  {ctaHref ? (
                    <Link href={ctaHref} className={ctaClass}>
                      {ctaLabel}
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* ── Priced menu: one client-uploaded graphic, click to enlarge ── */}
          {menuImage?.url && (
            <div className="px-8 md:px-12 py-8 md:py-10">
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                aria-label="Powiększ menu"
                className="group block w-full cursor-zoom-in overflow-hidden rounded-2xl ring-1 ring-brand-navy/15 transition-shadow hover:ring-brand-navy/40"
              >
                <span className="relative block">
                  <Image
                    src={menuImage.url}
                    alt={menuImage.alt || heading || 'Menu'}
                    width={menuImage.width || 1600}
                    height={menuImage.height || 1000}
                    className="h-auto w-full"
                    sizes="(max-width: 1280px) 100vw, 1200px"
                  />
                  <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 8v6M8 11h6M19 11a8 8 0 11-16 0 8 8 0 0116 0z" />
                    </svg>
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {menuImage?.url && (
        <Lightbox
          images={[{ src: menuImage.url, alt: menuImage.alt || heading || 'Menu' }]}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </section>
  )
}
