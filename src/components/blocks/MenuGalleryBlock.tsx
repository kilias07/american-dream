import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { MenuGalleryBlock as MenuGalleryBlockType, Media } from '@/payload-types'

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

/** A fixed-shape tile (the two-column / split layout). Menu graphics carry
 * text, so the image is shown whole (contain) — never cropped. */
function SplitTile({ media, ratio, alt }: { media: Media | null; ratio: string; alt: string }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-brand-navy-royal ring-1 ring-white/10"
      style={{ aspectRatio: ratio }}
    >
      {media?.url && (
        <Image
          src={media.url}
          alt={media.alt || alt}
          fill
          className="object-contain object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      )}
    </div>
  )
}

/** A full-width tile shown at its natural proportions (no cropping). */
function FullTile({ media, alt }: { media: Media | null; alt: string }) {
  if (!media?.url) return null
  const w = media.width || 1600
  const h = media.height || 900
  return (
    <div className="relative w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
      <Image
        src={media.url}
        alt={media.alt || alt}
        width={w}
        height={h}
        className="w-full h-auto"
        sizes="(max-width: 1280px) 100vw, 1280px"
      />
    </div>
  )
}

export function MenuGalleryBlock({
  block,
  locale,
}: {
  block: MenuGalleryBlockType
  locale: string
}) {
  const { eyebrow, heading, pdfLabel, rows } = block
  const ratio = block.aspectRatio || '4/5'
  const pdf = isMedia(block.pdfDownload) ? block.pdfDownload : null
  const pdfHref = pdf?.url || `/menu/menu-${locale}.pdf`
  const alt = heading || 'Menu'

  if (!rows?.length && !heading) return null

  return (
    <section id="menu" className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Optional header: eyebrow + heading + PDF button */}
        {(eyebrow || heading || pdfLabel) && (
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">
            <div>
              {eyebrow && <p className="text-white/55 text-sm md:text-base mb-1">{eyebrow}</p>}
              {heading && (
                <h2 className="font-serif text-white text-3xl md:text-5xl leading-tight inline-flex items-center gap-3">
                  {heading}
                  <span className="text-brand-gold">›</span>
                </h2>
              )}
            </div>
            {pdfLabel && (
              <Link
                href={pdfHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-3 rounded-full hover:bg-brand-gold-dark transition-colors whitespace-nowrap"
              >
                {pdfLabel}
              </Link>
            )}
          </div>
        )}

        {/* Rows: two-column tiles, or a single full-width tile. */}
        {rows && rows.length > 0 && (
          <div className="space-y-5 md:space-y-6">
            {rows.map((row, i) =>
              row.layout === 'full' ? (
                <FullTile key={row.id || i} media={isMedia(row.full) ? row.full : null} alt={alt} />
              ) : (
                <div key={row.id || i} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  <SplitTile media={isMedia(row.left) ? row.left : null} ratio={ratio} alt={alt} />
                  <SplitTile media={isMedia(row.right) ? row.right : null} ratio={ratio} alt={alt} />
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  )
}
