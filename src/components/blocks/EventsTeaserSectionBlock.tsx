import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { EventsTeaserBlock as EventsTeaserBlockType, Event, Media } from '@/payload-types'
import { EventsTeaserSectionClient } from './EventsTeaserSectionClient'
import type { TeaserEventCard } from './EventsTeaserSectionClient'

function isMedia(value: Media | number | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

export async function EventsTeaserSectionBlock({
  block,
  locale,
}: {
  block: EventsTeaserBlockType
  locale: string
}) {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'events',
    where: {
      date: { greater_than_equal: new Date().toISOString() },
      ...(block.onlyFeatured ? { featured: { equals: true } } : {}),
    },
    sort: 'date',
    limit: block.limit || 6,
    locale: locale as 'pl' | 'en' | 'all',
    depth: 1,
  })

  const events = docs as Event[]
  if (events.length === 0) return null

  const cards: TeaserEventCard[] = events.map((event) => {
    const media = isMedia(event.image) ? event.image : null
    const fallback = `/${locale}/program/${event.id}`
    return {
      id: event.id,
      title: event.title ?? '',
      dateISO: event.date ?? null,
      endTime: event.endTime ?? null,
      price: event.price ?? null,
      image: media?.url ? { url: media.url, alt: media.alt || event.title || '' } : null,
      ticketUrl: event.ticketUrl || event.reservationUrl || fallback,
    }
  })

  const heading = block.heading || (locale === 'pl' ? 'PROGRAM' : 'PROGRAM')
  const viewAllHref = block.viewAllUrl
    ? block.viewAllUrl.startsWith('/')
      ? `/${locale}${block.viewAllUrl}`
      : block.viewAllUrl
    : null

  return (
    <section className="py-12 md:py-16 bg-brand-gold">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            {block.eyebrow && (
              <p className="text-brand-navy/70 text-xs md:text-sm font-bold uppercase tracking-[0.18em] mb-2">
                {block.eyebrow}
              </p>
            )}
            <h2 className="font-serif text-brand-navy text-3xl md:text-5xl leading-tight">{heading}</h2>
          </div>

          {block.viewAllLabel && viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden md:inline-flex flex-shrink-0 items-center gap-2 bg-brand-navy text-white text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-navy-royal transition-colors whitespace-nowrap"
            >
              {block.viewAllLabel}
            </Link>
          )}
        </div>

        <EventsTeaserSectionClient cards={cards} locale={locale} />

        {block.viewAllLabel && viewAllHref && (
          <div className="mt-6 flex justify-center md:hidden">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 bg-brand-navy text-white text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-navy-royal transition-colors"
            >
              {block.viewAllLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
