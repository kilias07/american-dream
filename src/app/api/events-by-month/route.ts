import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { expandEvents } from '@/lib/recurring-events'
import type { EventDoc } from '@/lib/recurring-events'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const monthParam = url.searchParams.get('month') // e.g. "2026-03"
  const locale = (url.searchParams.get('locale') ?? 'pl') as string

  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return Response.json({ error: 'Invalid month parameter. Use YYYY-MM format.' }, { status: 400 })
  }

  const [yearStr, monthStr] = monthParam.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1 // convert to 0-indexed

  const rangeStart = new Date(year, month, 1)
  const rangeEnd = new Date(year, month + 1, 1)

  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'events' as any,
      locale: locale as any,
      limit: 1000,
      sort: 'date',
    })

    const occurrences = expandEvents(docs as unknown as EventDoc[], rangeStart, rangeEnd)

    return Response.json({ occurrences })
  } catch (error) {
    console.error('events-by-month error:', error)
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
