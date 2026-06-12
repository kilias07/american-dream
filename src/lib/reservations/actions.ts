import type { Payload } from 'payload'
import type { Reservation } from '@/payload-types'
import { getPaymentProvider } from '@/lib/integrations/payments'
import {
  notifyClientCancelled,
  notifyClientConfirmed,
  notifyClientRejected,
} from '@/lib/integrations/notifications'

// Moderation actions (spec §5). Every reservation requires manual approval.
// Reject/cancel of a PAID reservation triggers a full PayU refund (spec §4).

async function load(payload: Payload, id: number | string): Promise<Reservation> {
  return (await payload.findByID({ collection: 'reservations', id, depth: 0 })) as Reservation
}

/** Full refund for a paid reservation. Throws on failure so the caller can abort
 *  the state change and let the admin retry. Returns true if a refund happened. */
async function refundIfPaid(payload: Payload, r: Reservation): Promise<boolean> {
  if (r.paymentStatus !== 'paid' || !r.payuOrderId) return false
  const provider = getPaymentProvider()
  const result = await provider.refund(
    r.payuOrderId,
    undefined,
    `Zwrot rezerwacji ${r.reservationNumber}`,
  )
  await payload.update({
    collection: 'reservations',
    id: r.id,
    data: { paymentStatus: 'refunded', payuRefundId: result.refundId },
  })
  return true
}

export async function approveReservation(payload: Payload, id: number | string): Promise<Reservation> {
  const r = await load(payload, id)
  if (r.status === 'confirmed') return r
  const updated = (await payload.update({
    collection: 'reservations',
    id,
    data: { status: 'confirmed' },
  })) as Reservation
  await notifyClientConfirmed(payload, updated)
  return updated
}

export async function rejectReservation(payload: Payload, id: number | string): Promise<Reservation> {
  const r = await load(payload, id)
  const refunded = await refundIfPaid(payload, r)
  const updated = (await payload.update({
    collection: 'reservations',
    id,
    data: { status: 'rejected' },
  })) as Reservation
  await notifyClientRejected(payload, updated, { refunded })
  return updated
}

export async function cancelReservation(payload: Payload, id: number | string): Promise<Reservation> {
  const r = await load(payload, id)
  const refunded = await refundIfPaid(payload, r)
  const updated = (await payload.update({
    collection: 'reservations',
    id,
    data: { status: 'cancelled' },
  })) as Reservation
  await notifyClientCancelled(payload, updated, { refunded })
  return updated
}
