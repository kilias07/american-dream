import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { EveningPhasesBlock as EveningPhasesBlockType, Media, Event } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'
import { getUILabels, pick } from '@/lib/ui-labels'
import {
  toOccurrences,
  warsawParts,
  formatTime,
  type EventDoc,
} from '@/lib/recurring-events'
import {
  EveningPhasesClient,
  type PhaseData,
  type DayPill,
  type DayEvent,
} from './EveningPhasesClient'

type Phase = NonNullable<EveningPhasesBlockType['phases']>[number]

function isMedia(value: Media | number | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

type OpeningDay = {
  day?: string | null
  closed?: boolean | null
  openTime?: string | null
  closeTime?: string | null
  id?: string | null
}

const DAY_LABELS_PL: Record<string, string> = {
  monday: 'Poniedziałek',
  tuesday: 'Wtorek',
  wednesday: 'Środa',
  thursday: 'Czwartek',
  friday: 'Piątek',
  saturday: 'Sobota',
  sunday: 'Niedziela',
}
const DAY_LABELS_EN: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
// warsawParts().weekday is 0=Sun … 6=Sat.
const WEEKDAY_TO_DAY = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

async function getOpenDays(): Promise<OpeningDay[]> {
  const cached = unstable_cache(
    async () => {
      try {
        const payload = await getPayload({ config: configPromise })
        const oh = await payload.findGlobal({ slug: 'opening-hours', depth: 0 })
        return (oh?.days as OpeningDay[]) ?? []
      } catch {
        return []
      }
    },
    ['evening-phases-open-days'],
    { tags: ['global_opening_hours'] },
  )
  const raw = await cached()
  return DAY_ORDER.map((d) => raw.find((od) => od.day === d))
    .filter((od): od is OpeningDay => Boolean(od))
    .filter((od) => !od.closed)
}

/**
 * For each weekday, the NEXT upcoming calendar event that falls on it — so the
 * reservation-page day selector stays consistent with the kalendarium. Keyed by
 * day name (tuesday … sunday). `nowIso` is passed in so the cache key varies by
 * the request day (events drop off as they pass).
 */
async function getEventsByWeekday(locale: Locale, nowIso: string): Promise<Record<string, DayEvent>> {
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'events',
      where: { date: { greater_than_equal: nowIso } },
      sort: 'date',
      limit: 300,
      depth: 1,
      locale,
    })
    const occ = toOccurrences(res.docs as unknown as EventDoc[])
    const byDay: Record<string, DayEvent> = {}
    for (const o of occ) {
      const day = WEEKDAY_TO_DAY[warsawParts(new Date(o.dateISO)).weekday]
      if (!day || byDay[day]) continue // keep the earliest (events are sorted asc)
      const start = formatTime(o.dateISO)
      byDay[day] = {
        slug: o.eventSlug ?? '',
        title: o.title,
        description: o.description ?? null,
        timeLabel: o.endTime ? `${start}–${o.endTime}` : start,
        imageUrl: o.image?.url ?? null,
        imageAlt: o.image?.alt ?? o.title,
        price: o.price ?? null,
        eventType: o.eventType ?? null,
        detailsUrl: o.eventSlug ? localeHref(locale, `/events/${o.eventSlug}`) : null,
        dateISO: o.dateISO,
      }
    }
    return byDay
  } catch {
    return {}
  }
}

export async function EveningPhasesBlock({
  block,
  locale,
}: {
  block: EveningPhasesBlockType
  locale: string
}) {
  const { heading, phases } = block

  if (!phases?.length) return null

  const loc = locale as Locale
  const openDays = await getOpenDays()
  const fallbackLabels = locale === 'pl' ? DAY_LABELS_PL : DAY_LABELS_EN
  const ui = await getUILabels(loc)
  const uiDays = ui?.days as Record<string, string | null | undefined> | undefined
  const dayLabel = (day: string) => pick(uiDays?.[day], fallbackLabels[day] ?? '')

  // Only fetch the calendar when at least one phase is wired to it.
  const usesCalendar = phases.some((p) => p.linkToCalendar)
  const now = new Date()
  const eventsByDay = usesCalendar
    ? await getEventsByWeekday(loc, new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
    : {}

  const days: DayPill[] = openDays
    .filter((od): od is OpeningDay & { day: string } => Boolean(od.day))
    .map((od) => ({
      key: od.day,
      label: dayLabel(od.day),
      hours: `${od.openTime ?? ''}${od.closeTime ? ` - ${od.closeTime}` : ''}`,
      hasEvent: Boolean(eventsByDay[od.day]),
    }))

  // Default selection: today if it is an open day, otherwise the first open day.
  const todayKey = WEEKDAY_TO_DAY[warsawParts(now).weekday]
  const defaultDay = days.some((d) => d.key === todayKey) ? todayKey : (days[0]?.key ?? '')

  const prefix = (url?: string | null) =>
    url ? (url.startsWith('/') ? localeHref(loc, url) : url) : null

  const phasesData: PhaseData[] = phases.map((phase: Phase, i) => {
    const image = isMedia(phase.image) ? phase.image : null
    return {
      key: String(phase.id ?? i),
      title: phase.title ?? '',
      timeLabel: phase.timeLabel ?? '',
      body: phase.body ?? '',
      imageUrl: image?.url ?? null,
      imageAlt: image?.alt || phase.title || '',
      primaryCtaLabel: phase.primaryCtaLabel ?? null,
      primaryCtaEnabled: Boolean(phase.primaryCtaLabel && phase.primaryCtaUrl),
      primaryCtaIcon: (phase.primaryCtaIcon as 'reserve' | 'ticket' | null) ?? null,
      secondaryCtaLabel: phase.secondaryCtaLabel ?? null,
      secondaryCtaUrl: prefix(phase.secondaryCtaUrl),
      linkToCalendar: Boolean(phase.linkToCalendar),
    }
  })

  const reserveLabel = pick(ui?.event?.reserveTable, locale === 'pl' ? 'Zarezerwuj stolik' : 'Reserve a table')

  return (
    <EveningPhasesClient
      heading={heading ?? ''}
      days={days}
      defaultDay={defaultDay}
      phases={phasesData}
      eventsByDay={eventsByDay}
      reserveLabel={reserveLabel}
      locale={locale}
    />
  )
}
