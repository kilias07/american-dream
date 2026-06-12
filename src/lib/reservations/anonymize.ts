import type { Payload } from 'payload'

// RODO retention (spec §7): 12 months after the event, strip personal data from
// reservations but keep the record (stats/accounting). Idempotent via
// `anonymizedAt` — already-processed rows are skipped.
export async function anonymizeExpiredReservations(
  payload: Payload,
  batchSize = 500,
): Promise<{ anonymized: number }> {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 12)

  const { docs } = await payload.find({
    collection: 'reservations',
    where: {
      and: [
        { date: { less_than: cutoff.toISOString() } },
        { anonymizedAt: { exists: false } },
      ],
    },
    limit: batchSize,
    depth: 0,
  })

  let anonymized = 0
  for (const r of docs) {
    await payload.update({
      collection: 'reservations',
      id: r.id,
      data: {
        firstName: '—',
        lastName: '—',
        phone: null,
        email: null,
        anonymizedAt: new Date().toISOString(),
      },
    })
    anonymized++
  }
  return { anonymized }
}
