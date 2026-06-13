import { getPayload } from 'payload'
import config from '@payload-config'
import type { Event, Reservation } from '@/payload-types'
import { getPaymentProvider, PaymentNotConfiguredError } from '@/lib/integrations/payments'
import { notifyStaffNewReservation } from '@/lib/integrations/notifications'
import { subscribeToNewsletter } from '@/lib/integrations/mailerlite'
import { getServerUrl } from '@/lib/integrations/env'
import { localeHref } from '@/utilities/href'

// Public reservation intake (spec §3/§4). Free reservations land as
// `awaiting_approval`; paid (concert) reservations are created as
// `awaiting_payment` and the response carries a PayU redirect URL.
//
// Capacity is a SOFT limit (decision §9a): we never block here.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OPTIONS = ['opening', 'concert', 'club'] as const
type OptionKey = (typeof OPTIONS)[number]

type Body = {
  eventId?: number | string
  option?: string
  slotStart?: string
  slotEnd?: string
  guests?: number
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  locale?: string
  consentTerms?: boolean
  consentNewsletter?: boolean
}

function bad(error: string, status = 400) {
  return Response.json({ ok: false, error }, { status })
}

function optionConfig(event: Event, option: OptionKey) {
  if (option === 'opening') return event.optionOpening
  if (option === 'concert') return event.optionConcert
  return event.optionClub
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return bad('Invalid JSON body')
  }

  const option = body.option as OptionKey
  const locale = body.locale === 'en' ? 'en' : 'pl'
  const guests = Number(body.guests)

  // ── Validation ─────────────────────────────────────────────────────────────
  if (!body.eventId) return bad('Missing eventId')
  if (!OPTIONS.includes(option)) return bad('Invalid option')
  if (!Number.isInteger(guests) || guests < 1) return bad('Invalid guests count')
  if (!body.firstName || !body.lastName) return bad('Missing name')
  if (!body.phone) return bad('Missing phone')
  if (!body.email || !EMAIL_REGEX.test(body.email)) return bad('A valid email address is required')
  if (!body.consentTerms) return bad('Consent to terms is required')

  const payload = await getPayload({ config })

  // ── Event + option gating ────────────────────────────────────────────────--
  let event: Event
  try {
    event = await payload.findByID({ collection: 'events', id: body.eventId, depth: 0 })
  } catch {
    return bad('Event not found', 404)
  }
  if (!event.reservationsEnabled) return bad('Reservations are not enabled for this event')

  const optCfg = optionConfig(event, option)
  if (!optCfg?.enabled) return bad('This option is not available for this event')

  const pricePerPerson = option === 'concert' ? (event.optionConcert?.pricePerPerson ?? 0) : 0
  const amount = pricePerPerson > 0 ? pricePerPerson * guests : 0
  const paid = amount > 0

  // Slot snapshot — prefer client-sent (already shown to the user), fall back to
  // the event's configured option window.
  const slotStart = body.slotStart || optCfg.startTime || ''
  const slotEnd = body.slotEnd || optCfg.endTime || ''

  // ── Double-submit dedup (spec §4) ───────────────────────────────────────────
  // Reuse a matching in-flight reservation created in the last 2 minutes rather
  // than inserting a duplicate row.
  const since = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  const existing = await payload.find({
    collection: 'reservations',
    where: {
      and: [
        { email: { equals: body.email } },
        { event: { equals: event.id } },
        { option: { equals: option } },
        { guests: { equals: guests } },
        { createdAt: { greater_than_equal: since } },
        { status: { in: ['awaiting_payment', 'awaiting_approval'] } },
      ],
    },
    limit: 1,
    depth: 0,
  })

  let reservation: Reservation
  if (existing.docs.length > 0) {
    reservation = existing.docs[0] as Reservation
  } else {
    reservation = (await payload.create({
      collection: 'reservations',
      data: {
        event: event.id,
        date: event.date,
        option,
        slotStart,
        slotEnd,
        guests,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
        locale,
        consentTerms: true,
        consentNewsletter: Boolean(body.consentNewsletter),
        amount,
        status: paid ? 'awaiting_payment' : 'awaiting_approval',
        paymentStatus: paid ? 'pending' : 'none',
      },
    })) as Reservation
  }

  // Newsletter opt-in (best-effort, never blocks).
  if (body.consentNewsletter) {
    void subscribeToNewsletter(body.email, [body.firstName, body.lastName].filter(Boolean).join(' '), locale)
  }

  // ── Free flow ────────────────────────────────────────────────────────────--
  if (!paid) {
    await notifyStaffNewReservation(payload, reservation)
    return Response.json({ ok: true, mode: 'free', reservationNumber: reservation.reservationNumber })
  }

  // ── Paid flow → PayU ─────────────────────────────────────────────────────--
  const serverUrl = getServerUrl()
  try {
    const provider = getPaymentProvider()
    const order = await provider.createOrder({
      reservationNumber: reservation.reservationNumber as string,
      amount,
      description: `American Dream Club — ${reservation.reservationNumber}`,
      buyer: {
        email: body.email,
        phone: body.phone,
        firstName: body.firstName,
        lastName: body.lastName,
        ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || undefined,
      },
      continueUrl: `${serverUrl}${localeHref(locale, '/rezerwacja/status')}?id=${reservation.reservationNumber}`,
      notifyUrl: `${serverUrl}/api/payu/notify`,
      locale,
    })

    await payload.update({
      collection: 'reservations',
      id: reservation.id,
      data: { payuOrderId: order.orderId },
    })

    return Response.json({
      ok: true,
      mode: 'paid',
      reservationNumber: reservation.reservationNumber,
      redirectUrl: order.redirectUrl,
    })
  } catch (err) {
    if (err instanceof PaymentNotConfiguredError) {
      payload.logger.error('PayU not configured — cannot init payment')
      return bad('Payments are temporarily unavailable', 503)
    }
    payload.logger.error(`PayU createOrder failed: ${err instanceof Error ? err.message : err}`)
    return bad('Failed to initialise payment', 502)
  }
}
