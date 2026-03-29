export type DayCode = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

// JS getDay() returns 0=Sun, 1=Mon, ..., 6=Sat
const DAY_INDEX: Record<DayCode, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
}

export type EventDoc = {
  id: string | number
  title?: string | null
  description?: string | null
  image?: { url?: string | null; alt?: string | null } | number | null
  date?: string | null
  endTime?: string | null
  price?: number | null
  ticketUrl?: string | null
  featured?: boolean | null
  isRecurring?: boolean | null
  repeatType?: 'weekly' | 'monthly' | null
  repeatDays?: DayCode[] | null
  repeatUntil?: string | null
}

export type EventOccurrence = {
  id: string
  eventId: string | number
  title: string
  description?: string | null
  image?: { url: string; alt: string } | null
  dateISO: string
  endTime?: string | null
  price?: number | null
  ticketUrl?: string | null
  featured: boolean
}

function resolveImage(image: EventDoc['image']): { url: string; alt: string } | null {
  if (!image || typeof image === 'number') return null
  return { url: image.url ?? '', alt: image.alt ?? '' }
}

function makeOccurrence(event: EventDoc, date: Date): EventOccurrence {
  return {
    id: `${event.id}-${date.toISOString()}`,
    eventId: event.id,
    title: event.title ?? '',
    description: event.description,
    image: resolveImage(event.image),
    dateISO: date.toISOString(),
    endTime: event.endTime,
    price: event.price,
    ticketUrl: event.ticketUrl,
    featured: Boolean(event.featured),
  }
}

export function expandEvents(
  events: EventDoc[],
  rangeStart: Date,
  rangeEnd: Date,
): EventOccurrence[] {
  const occurrences: EventOccurrence[] = []

  for (const event of events) {
    if (!event.date) continue

    const eventStart = new Date(event.date)
    const repeatUntil = event.repeatUntil ? new Date(event.repeatUntil) : null
    const effectiveEnd = repeatUntil && repeatUntil < rangeEnd ? repeatUntil : rangeEnd

    if (!event.isRecurring) {
      if (eventStart >= rangeStart && eventStart < rangeEnd) {
        occurrences.push(makeOccurrence(event, eventStart))
      }
      continue
    }

    if (event.repeatType === 'weekly' && event.repeatDays && event.repeatDays.length > 0) {
      const targetDays = new Set(event.repeatDays.map((d) => DAY_INDEX[d]))
      const cursor = new Date(Math.max(rangeStart.getTime(), eventStart.getTime()))
      // Align cursor to start of day
      cursor.setHours(eventStart.getHours(), eventStart.getMinutes(), 0, 0)
      // Go back to the start of its day
      const dayStart = new Date(cursor)
      dayStart.setHours(0, 0, 0, 0)
      const rangeStartDay = new Date(rangeStart)
      rangeStartDay.setHours(0, 0, 0, 0)
      const walk = new Date(rangeStartDay)

      while (walk <= effectiveEnd) {
        if (targetDays.has(walk.getDay()) && walk >= new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())) {
          const occurrence = new Date(walk)
          occurrence.setHours(eventStart.getHours(), eventStart.getMinutes(), 0, 0)
          if (occurrence >= rangeStart && occurrence < rangeEnd) {
            occurrences.push(makeOccurrence(event, occurrence))
          }
        }
        walk.setDate(walk.getDate() + 1)
      }
    } else if (event.repeatType === 'monthly') {
      const dayOfMonth = eventStart.getDate()
      const walk = new Date(rangeStart)
      walk.setHours(0, 0, 0, 0)

      while (walk <= effectiveEnd) {
        if (walk.getDate() === dayOfMonth && walk >= new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate())) {
          const occurrence = new Date(walk)
          occurrence.setHours(eventStart.getHours(), eventStart.getMinutes(), 0, 0)
          if (occurrence >= rangeStart && occurrence < rangeEnd) {
            occurrences.push(makeOccurrence(event, occurrence))
          }
        }
        walk.setDate(walk.getDate() + 1)
      }
    }
  }

  occurrences.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())
  return occurrences
}

// ── Locale helpers ──────────────────────────────────────────────────────────

const DAY_ABBR_PL = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So']
const DAY_ABBR_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Monday-first order (index 0 = Monday)
export const WEEK_DAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
export const WEEK_DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function getDayAbbr(date: Date, locale: string): string {
  const abbrs = locale === 'pl' ? DAY_ABBR_PL : DAY_ABBR_EN
  return abbrs[date.getDay()].toUpperCase()
}

export function getMonthName(year: number, month: number, locale: string): string {
  const names = locale === 'pl' ? MONTHS_PL : MONTHS_EN
  return `${names[month].toUpperCase()} ${year}`
}

export function getWeekDays(locale: string): string[] {
  return locale === 'pl' ? WEEK_DAYS_PL : WEEK_DAYS_EN
}

/** Group occurrences by YYYY-MM-DD */
export function groupByDay(occurrences: EventOccurrence[]): Record<string, EventOccurrence[]> {
  const map: Record<string, EventOccurrence[]> = {}
  for (const occ of occurrences) {
    const d = new Date(occ.dateISO)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!map[key]) map[key] = []
    map[key].push(occ)
  }
  return map
}
