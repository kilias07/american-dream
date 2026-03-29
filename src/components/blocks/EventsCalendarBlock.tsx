import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { expandEvents } from '@/lib/recurring-events'
import type { EventDoc } from '@/lib/recurring-events'
import { EventsTeaserBlock } from './EventsTeaserBlock'
import { EventsFullCalendar } from './EventsFullCalendar'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventsCalendarData = Record<string, any>

async function fetchEvents(locale: string) {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'events' as any,
    locale: locale as any,
    limit: 1000,
    sort: 'date',
  })
  return docs as unknown as EventDoc[]
}

export async function EventsCalendarBlock({
  block,
  locale,
}: {
  block: EventsCalendarData
  locale?: string
}) {
  const loc = locale ?? 'pl'

  const cachedFetch = unstable_cache(() => fetchEvents(loc), [`events-${loc}`], {
    tags: ['events'],
  })
  const allEvents = await cachedFetch()

  const b = block as any
  const variant = b.variant as 'teaser' | 'full' ?? 'teaser'
  const heading = b.heading as string | undefined
  const ctaLabel = b.ctaLabel as string | undefined
  const ctaUrl = b.ctaUrl as string | undefined
  const eventsSource = (b.eventsSource as 'auto' | 'manual') ?? 'auto'
  const autoCount = (b.autoCount as number) ?? 6
  const manualEventIds = ((b.manualEvents as Array<any>) ?? []).map((e: any) =>
    typeof e === 'object' ? String(e.id) : String(e),
  )

  if (variant === 'full') {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const rangeStart = new Date(year, month, 1)
    const rangeEnd = new Date(year, month + 1, 1)

    const initialOccurrences = expandEvents(allEvents, rangeStart, rangeEnd)

    return (
      <EventsFullCalendar
        initialOccurrences={initialOccurrences}
        initialYear={year}
        initialMonth={month}
        heading={heading}
        ctaLabel={ctaLabel}
        ctaUrl={ctaUrl}
        locale={loc}
      />
    )
  }

  // Teaser — expand next 90 days
  const now = new Date()
  const futureEnd = new Date(now)
  futureEnd.setDate(futureEnd.getDate() + 90)

  let events = allEvents
  if (eventsSource === 'manual' && manualEventIds.length > 0) {
    events = allEvents.filter((e) => manualEventIds.includes(String(e.id)))
  }

  const occurrences = expandEvents(events, now, futureEnd).slice(0, autoCount)

  return (
    <EventsTeaserBlock
      occurrences={occurrences}
      heading={heading}
      ctaLabel={ctaLabel}
      ctaUrl={ctaUrl}
      locale={loc}
    />
  )
}
