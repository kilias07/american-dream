import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { MusiciansGridBlock as MusiciansGridBlockType, Media, Musician } from '@/payload-types'
import Image from 'next/image'
import Link from 'next/link'
import { localeHref } from '@/utilities/href'
import type { Locale } from '@/config/locales'
import type { MusicianCardData } from './MusiciansCarouselClient'

function isMedia(value: Media | number | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

function isMusician(value: number | Musician): value is Musician {
  return typeof value === 'object' && value !== null
}

async function getMusicians(block: MusiciansGridBlockType, locale: string): Promise<Musician[]> {
  const selected = (block.musicians ?? []).filter(isMusician)
  if (selected.length > 0) return selected

  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'musicians',
      locale: locale as 'pl' | 'en',
      sort: 'order',
      depth: 1,
      limit: 100,
    })
    return docs
  } catch {
    return []
  }
}

export async function MusiciansGridBlock({
  block,
  locale,
}: {
  block: MusiciansGridBlockType
  locale: string
}) {
  const { eyebrow, heading, intro } = block
  const musicians = await getMusicians(block, locale)

  if (musicians.length === 0) return null

  const cards: MusicianCardData[] = musicians.map((musician) => {
    const photo = isMedia(musician.photo) ? musician.photo : null
    return {
      id: musician.id,
      name: musician.name,
      instrument: musician.instrument ?? null,
      slug: musician.slug ?? null,
      image: photo?.url ? { url: photo.url, alt: photo.alt || musician.name } : null,
    }
  })

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {(eyebrow || heading) && (
          <div className="mb-8">
            {eyebrow && (
              <p className="text-brand-gold text-[12px] font-bold uppercase tracking-[0.18em] mb-2">
                {eyebrow}
              </p>
            )}
            {heading && (
              <h2 className="text-white font-serif text-3xl md:text-4xl font-bold uppercase tracking-tight">
                {heading}
              </h2>
            )}
            {intro && (
              <p className="text-white/70 text-sm md:text-base leading-relaxed mt-4 max-w-3xl">
                {intro}
              </p>
            )}
          </div>
        )}

        {/* Design: static grid with all musicians visible (no carousel). */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
          {cards.map((card) => {
            const href = card.slug ? localeHref(locale as Locale, `/muzycy/${card.slug}`) : null
            const inner = (
              <div className="group">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-brand-navy-royal mb-3">
                  {card.image?.url ? (
                    <Image
                      src={card.image.url}
                      alt={card.image.alt || card.name}
                      fill
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-brand-navy" />
                  )}
                </div>
                <h3 className="text-white text-base font-bold uppercase tracking-wide leading-tight">
                  {card.name}
                </h3>
                {card.instrument && (
                  <p className="text-brand-gold text-[11px] font-bold uppercase tracking-[0.12em] mt-1">
                    {card.instrument}
                  </p>
                )}
              </div>
            )
            return href ? (
              <Link
                key={card.id}
                href={href}
                className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
              >
                {inner}
              </Link>
            ) : (
              <div key={card.id}>{inner}</div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
