import React from 'react'
import Image from 'next/image'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { MusiciansGridBlock as MusiciansGridBlockType, Media, Musician } from '@/payload-types'

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

function MusicianCard({ musician }: { musician: Musician }) {
  const photo = isMedia(musician.photo) ? musician.photo : null

  return (
    <div className="group">
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-brand-navy-royal mb-3">
        {photo?.url ? (
          <Image
            src={photo.url}
            alt={photo.alt || musician.name}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-navy" />
        )}
      </div>
      <h3 className="text-white text-base font-bold uppercase tracking-wide leading-tight">
        {musician.name}
      </h3>
      {musician.instrument && (
        <p className="text-brand-gold text-[11px] font-bold uppercase tracking-[0.12em] mt-1">
          {musician.instrument}
        </p>
      )}
    </div>
  )
}

export async function MusiciansGridBlock({
  block,
  locale,
}: {
  block: MusiciansGridBlockType
  locale: string
}) {
  const { eyebrow, heading } = block
  const musicians = await getMusicians(block, locale)

  if (musicians.length === 0) return null

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
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
          {musicians.map((musician) => (
            <MusicianCard key={musician.id} musician={musician} />
          ))}
        </div>
      </div>
    </section>
  )
}
