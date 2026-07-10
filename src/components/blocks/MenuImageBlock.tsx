'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { Media, MenuImageBlock as MenuImageBlockType } from '@/payload-types'
import { Lightbox, type LightboxImage } from '@/components/Lightbox'

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

export function MenuImageBlock({ block, locale }: { block: MenuImageBlockType; locale?: string }) {
  const { eyebrow, heading } = block
  const enableLightbox = block.enableLightbox !== false

  // „Pobierz PDF" jak w restauracji (uwaga klienta 2026-07) — przycisk tylko
  // gdy PDF faktycznie wgrany (bez fallbacku, żeby nie linkować w 404).
  const pdf = isMedia(block.pdfDownload) ? block.pdfDownload : null
  const pdfLabel = pdf?.url
    ? block.pdfLabel || (locale === 'en' ? 'DOWNLOAD MENU (PDF)' : 'POBIERZ MENU (PDF)')
    : null

  const items = (block.images ?? [])
    .filter((item) => isMedia(item.image) && item.image.url)
    .map((item) => {
      const media = item.image as Media
      return {
        id: item.id,
        media,
        caption: item.caption ?? null,
      }
    })

  const lightboxImages: LightboxImage[] = items.map((it) => ({
    src: it.media.url!,
    alt: it.media.alt || heading || 'Menu',
    caption: it.caption,
  }))

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (items.length === 0) return null

  return (
    <section id="menu" className="bg-brand-navy py-12 md:py-16">
      <div className="container mx-auto max-w-[1280px] px-6 md:px-10">
        {(eyebrow || heading || pdfLabel) && (
          <div className="mb-8 text-center">
            {eyebrow && <p className="mb-1 text-sm text-white/55 md:text-base">{eyebrow}</p>}
            {heading && (
              <h2 className="font-serif text-3xl leading-tight text-white md:text-5xl">{heading}</h2>
            )}
            {pdfLabel && pdf?.url && (
              <a
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-3 rounded-full hover:bg-brand-gold-dark transition-colors whitespace-nowrap"
              >
                {pdfLabel}
              </a>
            )}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {items.map((it, i) => {
            const w = it.media.width || 1600
            const h = it.media.height || 1000
            const img = (
              <Image
                src={it.media.url!}
                alt={it.media.alt || heading || 'Menu'}
                width={w}
                height={h}
                className="h-auto w-full"
                sizes="(max-width: 1280px) 100vw, 1200px"
              />
            )
            return (
              <figure key={it.id ?? i} className="m-0">
                {enableLightbox ? (
                  <button
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    aria-label="Enlarge menu"
                    className="group block w-full cursor-zoom-in overflow-hidden rounded-2xl ring-1 ring-white/10 transition-shadow hover:ring-brand-gold/50"
                  >
                    <span className="relative block">
                      {img}
                      <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 8v6M8 11h6M19 11a8 8 0 11-16 0 8 8 0 0116 0z" />
                        </svg>
                      </span>
                    </span>
                  </button>
                ) : (
                  <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">{img}</div>
                )}
                {it.caption && (
                  <figcaption className="pt-3 text-center text-sm text-white/70">{it.caption}</figcaption>
                )}
              </figure>
            )
          })}
        </div>
      </div>

      {enableLightbox && (
        <Lightbox
          images={lightboxImages}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      )}
    </section>
  )
}
