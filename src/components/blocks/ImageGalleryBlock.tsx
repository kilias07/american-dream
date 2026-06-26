'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import type { Media, Page } from '@/payload-types'
import { Lightbox, type LightboxImage } from '@/components/Lightbox'

type ImageGalleryData = Extract<NonNullable<Page['layout']>[number], { blockType: 'imageGallery' }>

function isMedia(value: number | Media): value is Media {
  return typeof value === 'object' && value !== null
}

// Desktop column count → static Tailwind class (must be literal for the JIT).
const COLS_CLASS: Record<string, string> = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-3',
  '4': 'md:grid-cols-4',
}

// Tile size → grid span. On mobile (2 cols) wide/large fill the row.
const SPAN_CLASS: Record<string, string> = {
  normal: '',
  wide: 'col-span-2',
  tall: 'row-span-2',
  large: 'col-span-2 row-span-2',
}

export function ImageGalleryBlock({ block }: { block: ImageGalleryData }) {
  const items = (block.images ?? []).filter((item) => isMedia(item.image) && item.image.url)
  const colsClass = COLS_CLASS[block.columns ?? '3'] ?? COLS_CLASS['3']
  const enableLightbox = block.enableLightbox !== false

  const lightboxImages: LightboxImage[] = items.map((item) => {
    const media = item.image as Media
    return { src: media.url!, alt: media.alt || item.caption || '', caption: item.caption ?? null }
  })

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (items.length === 0) return null

  return (
    <section className="bg-brand-navy py-12 md:py-16">
      <div className="container mx-auto max-w-[1280px] px-6 md:px-10">
        <div
          className={`grid grid-cols-2 ${colsClass} gap-3 md:gap-4 [grid-auto-flow:dense] auto-rows-[44vw] sm:auto-rows-[34vw] md:auto-rows-[200px] lg:auto-rows-[230px]`}
        >
          {items.map((item, i) => {
            const media = item.image as Media
            const span = SPAN_CLASS[item.size ?? 'normal'] ?? ''
            const inner = (
              <>
                <Image
                  src={media.url!}
                  alt={media.alt || item.caption || ''}
                  fill
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                {item.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm text-white/90">
                    {item.caption}
                  </span>
                )}
              </>
            )
            return (
              <figure
                key={item.id ?? i}
                className={`group relative m-0 overflow-hidden rounded-2xl bg-brand-navy-royal ${span}`}
              >
                {enableLightbox ? (
                  <button
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    aria-label="Enlarge photo"
                    className="absolute inset-0 h-full w-full cursor-zoom-in"
                  >
                    {inner}
                  </button>
                ) : (
                  inner
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
