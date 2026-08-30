import React from 'react'
import { intlLocale } from '@/config/ui-strings'
import { ui as uiText } from '@/config/ui-strings'
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
  todayWarsaw,
  dayKey,
  warsawDayKey,
  weekTueKey,
  addDaysKey,
  type EventDoc,
} from '@/lib/recurring-events'
import {
  EveningPhasesClient,
  type PhaseData,
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

/** How far ahead the reservation calendar lets a guest look. */
const WEEKS_AHEAD = 8

/**
 * Every upcoming event keyed by its Warsaw date (YYYY-MM-DD), for the next
 * `WEEKS_AHEAD` weeks.
 *
 * This used to collapse to one event per weekday — the next Tuesday, the next
 * Wednesday and so on — which is all a single-week view needs. Once guests can
 * page forward through the calendar that is no longer enough: the Tuesday two
 * weeks out has its own programme.
 */
async function getEventsByDate(
  locale: Locale,
  fromIso: string,
  toIso: string,
): Promise<Record<string, DayEvent>> {
  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'events',
      where: {
        date: { greater_than_equal: fromIso, less_than_equal: toIso },
        published: { not_equals: false },
      },
      sort: 'date',
      limit: 500,
      depth: 1,
      locale,
    })
    const occ = toOccurrences(res.docs as unknown as EventDoc[])
    const byDate: Record<string, DayEvent> = {}
    for (const o of occ) {
      const key = warsawDayKey(o.dateISO)
      if (byDate[key]) continue // keep the earliest of the day (sorted asc)
      const start = formatTime(o.dateISO)
      byDate[key] = {
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
    return byDate
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
  // Pełne nazwy dni: PL/EN z list poniżej (zaprojektowany zapis), reszta z `Intl`.
  const fallbackLabels: Record<string, string> =
    locale === 'pl'
      ? DAY_LABELS_PL
      : locale === 'en'
        ? DAY_LABELS_EN
        : Object.fromEntries(
            ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].map((d, i) => [
              d,
              new Intl.DateTimeFormat(intlLocale(locale as Locale), { weekday: 'long' })
                .format(new Date(Date.UTC(2024, 0, 7 + i, 12)))
                .replace(/^./, (c) => c.toUpperCase()),
            ]),
          )
  const ui = await getUILabels(loc)
  const uiDays = ui?.days as Record<string, string | null | undefined> | undefined
  const dayLabel = (day: string) => pick(uiDays?.[day], fallbackLabels[day] ?? '')

  // Only fetch the calendar when at least one phase is wired to it.
  const usesCalendar = phases.some((p) => p.linkToCalendar)
  const now = new Date()
  const t = todayWarsaw(now)
  const todayKey = dayKey(t.year, t.month, t.day)
  // The club week runs Tuesday→Sunday; on a Monday `weekTueKey` already points
  // at tomorrow, so the calendar never opens on a week that is over.
  const firstWeekStart = weekTueKey(todayKey)
  const lastDay = addDaysKey(firstWeekStart, WEEKS_AHEAD * 7 - 1)

  const eventsByDate = usesCalendar
    ? await getEventsByDate(loc, `${todayKey}T00:00:00.000Z`, `${lastDay}T23:59:59.999Z`)
    : {}

  // Weekdays the club is open, in club-week order (Tue…Sun) with their offset
  // from the week's Tuesday — that offset turns a week start into real dates.
  const openWeekdays = openDays
    .filter((od): od is OpeningDay & { day: string } => Boolean(od.day))
    .map((od) => ({
      key: od.day,
      label: dayLabel(od.day),
      hours: `${od.openTime ?? ''}${od.closeTime ? ` - ${od.closeTime}` : ''}`,
      offset: (DAY_ORDER.indexOf(od.day) + 6) % 7, // monday=0 → Tue=0, …, Sun=5
    }))
    .filter((d) => d.offset >= 0)
    .sort((a, b) => a.offset - b.offset)

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

  const reserveLabel = pick(ui?.event?.reserveTable, uiText(locale as Locale).reserveTable)

  return (
    <EveningPhasesClient
      heading={heading ?? ''}
      weekdays={openWeekdays}
      firstWeekStart={firstWeekStart}
      weeksAhead={WEEKS_AHEAD}
      todayKey={todayKey}
      phases={phasesData}
      eventsByDate={eventsByDate}
      reserveLabel={reserveLabel}
      locale={locale}
    />
  )
}
