// Add-to-calendar helpers (iCal .ics + Google Calendar), Europe/Warsaw aware.
//
// Events are stored as instants (ISO/UTC). `endTime` is a Warsaw wall-clock
// "HH:MM". For .ics we emit DTSTART/DTEND in UTC (unambiguous, every client
// understands it). For Google we emit Warsaw wall-clock + `ctz=Europe/Warsaw`.

import { TIME_ZONE, warsawParts } from './recurring-events'

export const VENUE = 'American Dream Club, ul. Dominikańska 9, 61-762 Poznań'

export type CalendarEventInput = {
  id: string | number
  title: string
  description?: string | null
  location?: string | null
  startISO: string
  endTime?: string | null // "HH:MM" in Europe/Warsaw
}

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** End instant: combine the event's Warsaw day with `endTime`, else +2h. */
function endInstant(startISO: string, endTime?: string | null): Date {
  const start = new Date(startISO)
  if (!endTime || !/^\d{1,2}:\d{2}$/.test(endTime)) {
    return new Date(start.getTime() + DEFAULT_DURATION_MS)
  }
  const sp = warsawParts(start)
  const [eh, em] = endTime.split(':').map((v) => parseInt(v, 10))
  let mins = eh * 60 + em - (sp.hour * 60 + sp.minute)
  if (mins <= 0) mins += 24 * 60 // crosses midnight
  return new Date(start.getTime() + mins * 60 * 1000)
}

/** YYYYMMDDTHHMMSSZ (UTC basic format). */
function fmtUTC(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

/** YYYYMMDDTHHMMSS in Europe/Warsaw wall-clock (no Z) — for Google's ctz. */
function fmtWarsawWall(d: Date): string {
  const p = warsawParts(d)
  return `${p.year}${pad(p.month + 1)}${pad(p.day)}T${pad(p.hour)}${pad(p.minute)}00`
}

function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Build a single-event VCALENDAR string. */
export function buildICS(event: CalendarEventInput): string {
  const start = new Date(event.startISO)
  const end = endInstant(event.startISO, event.endTime)
  const location = event.location ?? VENUE
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//American Dream Club//Events//PL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${event.id}-${fmtUTC(start)}@americandreamclub.pl`,
    `DTSTAMP:${fmtUTC(start)}`,
    `DTSTART:${fmtUTC(start)}`,
    `DTEND:${fmtUTC(end)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    ...(event.description ? [`DESCRIPTION:${escapeICS(event.description)}`] : []),
    `LOCATION:${escapeICS(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

/** Google Calendar "add event" URL (Europe/Warsaw). */
export function googleCalendarUrl(event: CalendarEventInput): string {
  const start = new Date(event.startISO)
  const end = endInstant(event.startISO, event.endTime)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmtWarsawWall(start)}/${fmtWarsawWall(end)}`,
    ctz: TIME_ZONE,
    location: event.location ?? VENUE,
  })
  if (event.description) params.set('details', event.description)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** A safe filename for the .ics download. */
export function icsFilename(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${slug || 'event'}.ics`
}

/** Trigger a client-side .ics download (browser only). */
export function downloadICS(event: CalendarEventInput): void {
  const blob = new Blob([buildICS(event)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = icsFilename(event.title)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
