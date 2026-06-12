import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { MusiciansGridBlock as MusiciansGridBlockType, Media, Musician } from '@/payload-types'
import { MusiciansCarouselClient } from './MusiciansCarouselClient'
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

        <MusiciansCarouselClient cards={cards} locale={locale} />
      </div>
    </section>
  )
}
