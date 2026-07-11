// Calendar/event helpers.
//
// NOTE: events no longer recur — every event is a single, individually-created
// document with one concrete date/time. This module keeps the historical name
// (`recurring-events`) and the `expandEvents` export for compatibility, but
// expansion is now just a date-range filter. All formatting and day-grouping is
// done in the club's timezone (Europe/Warsaw) so the server and client always
// agree regardless of where they run.

export const TIME_ZONE = 'Europe/Warsaw'

export type EventDoc = {
  id: string | number
  slug?: string | null
  title?: string | null
  description?: string | null
  leadTitle?: string | null
  image?: { url?: string | null; alt?: string | null } | number | null
  date?: string | null
  endTime?: string | null
  price?: number | null
  ticketUrl?: string | null
  reservationUrl?: string | null
  featured?: boolean | null
  showOnHomepage?: boolean | null
  eventType?: 'standard' | 'special' | null
  genres?: Array<{ title?: string | null } | number | null> | null
  performers?:
    | Array<{
        musician?: { name?: string | null } | number | null
        instrument?: string | null
      } | null>
    | null
}

export type OccurrencePerformer = { name: string; instrument?: string | null }

export type EventOccurrence = {
  id: string
  eventId: string | number
  eventSlug?: string | null
  title: string
  description?: string | null
  leadTitle?: string | null
  image?: { url: string; alt: string } | null
  dateISO: string
  endTime?: string | null
  price?: number | null
  ticketUrl?: string | null
  reservationUrl?: string | null
  featured: boolean
  eventType?: 'standard' | 'special' | null
  genres: string[]
  performers: OccurrencePerformer[]
}

function resolveImage(image: EventDoc['image']): { url: string; alt: string } | null {
  if (!image || typeof image === 'number') return null
  return { url: image.url ?? '', alt: image.alt ?? '' }
}

function resolveGenres(genres: EventDoc['genres']): string[] {
  if (!genres) return []
  return genres
    .map((g) => (g && typeof g === 'object' ? (g.title ?? '') : ''))
    .filter((t): t is string => Boolean(t))
}

function resolvePerformers(performers: EventDoc['performers']): OccurrencePerformer[] {
  if (!performers) return []
  const out: OccurrencePerformer[] = []
  for (const p of performers) {
    if (!p) continue
    const name = p.musician && typeof p.musician === 'object' ? (p.musician.name ?? '') : ''
    if (!name) continue
    out.push({ name, instrument: p.instrument ?? null })
  }
  return out
}

function makeOccurrence(event: EventDoc): EventOccurrence {
  return {
    id: String(event.id),
    eventId: event.id,
    eventSlug: event.slug ?? null,
    title: event.title ?? '',
    description: event.description,
    leadTitle: event.leadTitle ?? null,
    image: resolveImage(event.image),
    dateISO: event.date as string,
    endTime: event.endTime,
    price: event.price,
    ticketUrl: event.ticketUrl ?? null,
    reservationUrl: event.reservationUrl ?? null,
    featured: Boolean(event.featured),
    eventType: event.eventType ?? null,
    genres: resolveGenres(event.genres),
    performers: resolvePerformers(event.performers),
  }
}

/** Map raw event docs into sorted occurrences (drops events without a date). */
export function toOccurrences(events: EventDoc[]): EventOccurrence[] {
  const occurrences = events.filter((e) => Boolean(e.date)).map(makeOccurrence)
  occurrences.sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())
  return occurrences
}

/**
 * Return the occurrences whose date falls within [rangeStart, rangeEnd).
 * (Formerly expanded recurring events — now a plain range filter.)
 */
export function expandEvents(
  events: EventDoc[],
  rangeStart: Date,
  rangeEnd: Date,
): EventOccurrence[] {
  return toOccurrences(events).filter((occ) => {
    const t = new Date(occ.dateISO).getTime()
    return t >= rangeStart.getTime() && t < rangeEnd.getTime()
  })
}

// ── Timezone-aware date parts ────────────────────────────────────────────────

export type WarsawParts = {
  year: number
  month: number // 0-indexed
  day: number
  hour: number
  minute: number
  weekday: number // 0=Sun … 6=Sat
}

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  weekday: 'short',
})

/** Break an instant down into its Europe/Warsaw calendar parts. */
export function warsawParts(date: Date): WarsawParts {
  const parts = partsFormatter.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  let hour = parseInt(get('hour'), 10)
  if (hour === 24) hour = 0 // some engines emit "24" for midnight
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10) - 1,
    day: parseInt(get('day'), 10),
    hour,
    minute: parseInt(get('minute'), 10),
    weekday: WEEKDAY_TO_INDEX[get('weekday')] ?? 0,
  }
}

/** Today's date in Europe/Warsaw, as { year, month (0-idx), day }. */
export function todayWarsaw(now: Date = new Date()): { year: number; month: number; day: number } {
  const p = warsawParts(now)
  return { year: p.year, month: p.month, day: p.day }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Day key (YYYY-MM-DD) from y/m/d numbers. */
export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

/** Day key (YYYY-MM-DD) for an ISO instant, in Europe/Warsaw. */
export function warsawDayKey(iso: string): string {
  const p = warsawParts(new Date(iso))
  return dayKey(p.year, p.month, p.day)
}

/** HH:MM time of an ISO instant, in Europe/Warsaw. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const p = warsawParts(new Date(iso))
  return `${pad(p.hour)}:${pad(p.minute)}`
}

// ── Week helpers (pure YYYY-MM-DD string math, DST-safe) ────────────────────

/** Add `days` to a YYYY-MM-DD key and return the resulting key. */
export function addDaysKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

/**
 * Klucz WTORKU tygodnia klubowego (wt→nd) zawierającego dany dzień.
 * Poniedziałek (klub zamknięty, dzień „pomiędzy" tygodniami) wskazuje na
 * NADCHODZĄCY tydzień (jutro), nie na miniony.
 */
export function weekTueKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0=Sun … 6=Sat
  if (dow === 1) return addDaysKey(key, 1) // Monday → next Tuesday
  return addDaysKey(key, -((dow + 5) % 7)) // Tue→0, Wed→1, …, Sun→5
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

/** Weekday abbreviation for an ISO instant, in Europe/Warsaw. */
export function getDayAbbr(date: Date, locale: string): string {
  const weekday = warsawParts(date).weekday
  const abbrs = locale === 'pl' ? DAY_ABBR_PL : DAY_ABBR_EN
  return abbrs[weekday].toUpperCase()
}

export function getMonthName(year: number, month: number, locale: string): string {
  const names = locale === 'pl' ? MONTHS_PL : MONTHS_EN
  return `${names[month].toUpperCase()} ${year}`
}

// The club is closed on Mondays, so the calendar never shows them — the visible
// week runs Tuesday→Sunday (drop the leading Monday from the Monday-first arrays).
export function getWeekDays(locale: string): string[] {
  return (locale === 'pl' ? WEEK_DAYS_PL : WEEK_DAYS_EN).slice(1)
}

/** Group occurrences by their Europe/Warsaw day key (YYYY-MM-DD). */
export function groupByDay(occurrences: EventOccurrence[]): Record<string, EventOccurrence[]> {
  const map: Record<string, EventOccurrence[]> = {}
  for (const occ of occurrences) {
    const key = warsawDayKey(occ.dateISO)
    if (!map[key]) map[key] = []
    map[key].push(occ)
  }
  return map
}
