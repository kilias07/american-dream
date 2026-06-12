import { getPayload } from 'payload'
import config from '@payload-config'
import type { Event } from '@/payload-types'

// Public list of reservable events for the booking wizard (spec §3 step 2).
// Returns upcoming events with reservations enabled and, per event, which of the
// three options are available (concert carries its per-person price).

export type AvailabilityOption = { startTime: string; endTime: string }
export type AvailabilityConcert = AvailabilityOption & { pricePerPerson: number }
export type AvailabilityEvent = {
  id: number
  dateISO: string
  title: string
  options: {
    opening: AvailabilityOption | null
    concert: AvailabilityConcert | null
    club: AvailabilityOption | null
  }
}

function opt(o: Event['optionOpening'] | Event['optionClub']): AvailabilityOption | null {
  if (!o?.enabled) return null
  return { startTime: o.startTime ?? '', endTime: o.endTime ?? '' }
}

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const now = new Date().toISOString()
    const { docs } = await payload.find({
      collection: 'events',
      where: {
        and: [{ reservationsEnabled: { equals: true } }, { date: { greater_than_equal: now } }],
      },
      sort: 'date',
      limit: 100,
      depth: 0,
    })

    const events: AvailabilityEvent[] = (docs as Event[])
      .map((e) => {
        const concert: AvailabilityConcert | null = e.optionConcert?.enabled
          ? {
              startTime: e.optionConcert.startTime ?? '',
              endTime: e.optionConcert.endTime ?? '',
              pricePerPerson: e.optionConcert.pricePerPerson ?? 0,
            }
          : null
        const options = {
          opening: opt(e.optionOpening),
          concert,
          club: opt(e.optionClub),
        }
        return {
          id: e.id,
          dateISO: e.date as string,
          title: (e.title as string) ?? '',
          options,
        }
      })
      // Drop events where no option is actually enabled.
      .filter((e) => e.options.opening || e.options.concert || e.options.club)

    return Response.json({ events })
  } catch {
    return Response.json({ events: [] }, { status: 200 })
  }
}
