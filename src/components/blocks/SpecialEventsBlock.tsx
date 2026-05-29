import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { SpecialEventsBlock as SpecialEventsBlockType, Event, Media, Musician } from '@/payload-types'
import { SpecialEventsClient } from './SpecialEventsClient'
import type { SpecialEventCard } from './SpecialEventsClient'

function isMedia(value: Media | number | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

function isMusician(value: Musician | number | null | undefined): value is Musician {
  return typeof value === 'object' && value !== null
}

export async function SpecialEventsBlock({
  block,
  locale,
}: {
  block: SpecialEventsBlockType
  locale: string
}) {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'events',
    where: {
      eventType: { equals: 'special' },
    },
    sort: 'date',
    limit: block.limit || 4,
    locale: locale as 'pl' | 'en' | 'all',
    depth: 1,
  })

  const events = docs as Event[]
  if (events.length === 0) return null

  const cards: SpecialEventCard[] = events.map((event) => {
    const poster = isMedia(event.posterImage) ? event.posterImage : isMedia(event.image) ? event.image : null
    const performers = (event.performers ?? [])
      .map((p) => (isMusician(p.musician) ? p.musician.name : null))
      .filter((n): n is string => Boolean(n))

    const fallbackReserve = `/${locale}/program/${event.id}`
    const reserveUrl = event.ticketUrl || event.reservationUrl || fallbackReserve

    return {
      id: event.id,
      title: event.title ?? '',
      performers,
      dateISO: event.date ?? null,
      image: poster?.url ? { url: poster.url, alt: poster.alt || event.title || '' } : null,
      reserveUrl,
    }
  })

  const heading = block.heading || (locale === 'pl' ? 'WYDARZENIA SPECJALNE' : 'SPECIAL EVENTS')

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="mb-8">
          {block.eyebrow && (
            <p className="text-brand-gold text-xs md:text-sm font-bold uppercase tracking-[0.18em] mb-2">
              {block.eyebrow}
            </p>
          )}
          <h2 className="font-serif text-white text-3xl md:text-5xl leading-tight">{heading}</h2>
        </div>

        <SpecialEventsClient cards={cards} locale={locale} />
      </div>
    </section>
  )
}
