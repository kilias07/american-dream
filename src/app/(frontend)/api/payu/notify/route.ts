import { getPayload } from 'payload'
import config from '@payload-config'
import type { Reservation } from '@/payload-types'
import { getPaymentProvider, PaymentNotConfiguredError } from '@/lib/integrations/payments'
import { notifyStaffNewReservation } from '@/lib/integrations/notifications'

// PayU server-to-server webhook (spec §4). Verifies the signature, is idempotent
// on `payuOrderId`, and on payment moves the reservation
// `awaiting_payment` → `awaiting_approval` (+ `paymentStatus: paid`) and e-mails
// staff. Always returns 200 once the signature is valid so PayU stops retrying;
// returns 400 only on signature failure.

export async function POST(request: Request) {
  const rawBody = await request.text()

  const payload = await getPayload({ config })
  const provider = getPaymentProvider()

  let parsed
  try {
    parsed = await provider.verifyAndParseWebhook(rawBody, request.headers)
  } catch (err) {
    if (err instanceof PaymentNotConfiguredError) {
      payload.logger.error('PayU not configured — webhook ignored')
      return new Response('Not configured', { status: 503 })
    }
    payload.logger.warn(`PayU webhook rejected: ${err instanceof Error ? err.message : err}`)
    return new Response('Invalid signature', { status: 400 })
  }

  const { docs } = await payload.find({
    collection: 'reservations',
    where: { payuOrderId: { equals: parsed.orderId } },
    limit: 1,
    depth: 0,
  })
  const reservation = docs[0] as Reservation | undefined
  if (!reservation) {
    payload.logger.warn(`PayU webhook: no reservation for order ${parsed.orderId}`)
    return new Response('OK', { status: 200 }) // ack so PayU stops retrying
  }

  // Idempotency: already settled → ack and do nothing.
  if (parsed.status === 'paid' && reservation.paymentStatus === 'paid') {
    return new Response('OK', { status: 200 })
  }

  if (parsed.status === 'paid') {
    const updated = (await payload.update({
      collection: 'reservations',
      id: reservation.id,
      data: { paymentStatus: 'paid', status: 'awaiting_approval' },
    })) as Reservation
    await notifyStaffNewReservation(payload, updated)
  } else if (parsed.status === 'failed' || parsed.status === 'cancelled') {
    await payload.update({
      collection: 'reservations',
      id: reservation.id,
      data: { paymentStatus: 'failed' },
    })
  }
  // 'pending' → no state change.

  return new Response('OK', { status: 200 })
}
