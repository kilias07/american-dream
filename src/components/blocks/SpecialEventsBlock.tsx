import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type {
  SpecialEventsBlock as SpecialEventsBlockType,
  Event,
  Media,
  Musician,
  SiteSetting,
} from '@/payload-types'
import { SpecialEventsClient } from './SpecialEventsClient'
import type { SpecialEventCard, SpecialContact } from './SpecialEventsClient'

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
    where: { eventType: { equals: 'special' } },
    sort: 'date',
    limit: block.limit || 6,
    locale: locale as 'pl' | 'en' | 'all',
    depth: 1,
  })

  let settings: SiteSetting | null = null
  try {
    settings = (await payload.findGlobal({
      slug: 'site-settings',
      locale: locale as 'pl' | 'en',
      depth: 0,
    })) as SiteSetting
  } catch {
    settings = null
  }

  const events = docs as Event[]
  if (events.length === 0) return null

  const cards: SpecialEventCard[] = events.map((event) => {
    const poster = isMedia(event.posterImage)
      ? event.posterImage
      : isMedia(event.image)
        ? event.image
        : null
    const performers = (event.performers ?? [])
      .map((p) => {
        const name = isMusician(p.musician) ? p.musician.name : null
        return name ? { name, instrument: p.instrument ?? null } : null
      })
      .filter((p): p is { name: string; instrument: string | null } => Boolean(p))

    return {
      id: event.id,
      slug: event.slug ?? null,
      title: event.title ?? '',
      leadTitle: event.leadTitle ?? null,
      performers,
      dateISO: event.date ?? null,
      endTime: event.endTime ?? null,
      price: event.price ?? null,
      image: poster?.url ? { url: poster.url, alt: poster.alt || event.title || '' } : null,
    }
  })

  const contact: SpecialContact = {
    phone: settings?.phones?.[0]?.number ?? '+48 500 210 333',
    email:
      settings?.emails?.find((e) => /rezerw/i.test(e.label ?? ''))?.email ??
      settings?.emails?.[0]?.email ??
      'rezerwacja@americandreamclub.pl',
    address: (settings?.address as string) ?? 'American Dream Club · ul. Dominikańska 9 · Poznań',
  }

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

        <SpecialEventsClient cards={cards} contact={contact} locale={locale} />
      </div>
    </section>
  )
}
