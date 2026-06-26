import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { expandEvents, toOccurrences, todayWarsaw, warsawParts } from '@/lib/recurring-events'
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
    depth: 1, // populate image (calendar cards) + genres/performers (event pages)
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
  const colorScheme = (b.colorScheme as 'gold' | 'white') ?? 'gold'
  const eventsSource = (b.eventsSource as 'auto' | 'manual') ?? 'auto'
  const autoCount = (b.autoCount as number) ?? 6
  const manualEventIds = ((b.manualEvents as Array<any>) ?? []).map((e: any) =>
    typeof e === 'object' ? String(e.id) : String(e),
  )

  if (variant === 'full') {
    const occurrences = toOccurrences(allEvents)

    // Bounds (Europe/Warsaw): forward to current month + 3; back to the month of
    // the earliest event (never past the current month).
    const today = todayWarsaw()
    const currentAbs = today.year * 12 + today.month
    const maxMonthAbs = currentAbs + 3
    let minMonthAbs = currentAbs
    if (occurrences.length > 0) {
      const first = warsawParts(new Date(occurrences[0].dateISO))
      const firstAbs = first.year * 12 + first.month
      if (firstAbs < minMonthAbs) minMonthAbs = firstAbs
    }
    const todayKey = `${today.year}-${String(today.month + 1).padStart(2, '0')}-${String(today.day).padStart(2, '0')}`

    return (
      <EventsFullCalendar
        occurrences={occurrences}
        initialYear={today.year}
        initialMonth={today.month}
        minMonthAbs={minMonthAbs}
        maxMonthAbs={maxMonthAbs}
        todayKey={todayKey}
        heading={heading}
        ctaLabel={ctaLabel}
        ctaUrl={ctaUrl}
        locale={loc}
      />
    )
  }

  // Teaser — next 90 days
  const now = new Date()
  const futureEnd = new Date(now)
  futureEnd.setDate(futureEnd.getDate() + 90)

  let events = allEvents
  if (eventsSource === 'manual' && manualEventIds.length > 0) {
    events = allEvents.filter((e) => manualEventIds.includes(String(e.id)))
  } else {
    // Auto mode: show every upcoming event except those an editor has explicitly
    // hidden from the homepage teaser (showOnHomepage === false). Legacy events
    // without the flag default to shown. Past events fall off on their own via the
    // date-range filter below — no need to re-tick anything once an event is over.
    events = allEvents.filter((e) => e.showOnHomepage !== false)
  }

  const occurrences = expandEvents(events, now, futureEnd).slice(0, Math.max(autoCount, 20))

  return (
    <EventsTeaserBlock
      occurrences={occurrences}
      heading={heading}
      ctaLabel={ctaLabel}
      ctaUrl={ctaUrl}
      locale={loc}
      colorScheme={colorScheme}
    />
  )
}
