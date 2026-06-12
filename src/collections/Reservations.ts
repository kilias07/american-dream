import type { CollectionConfig, CollectionBeforeChangeHook, Endpoint } from 'payload'
import { APIError } from 'payload'
import { warsawParts } from '@/lib/recurring-events'
import {
  approveReservation,
  cancelReservation,
  rejectReservation,
} from '@/lib/reservations/actions'

// Reservation numbers are human-facing and sequential per calendar month
// (Europe/Warsaw): `ADC-YYYYMM-NNNN`. The NNNN counter resets each month. We
// derive the next value by finding the highest existing number in the same
// month — because NNNN is zero-padded to a fixed width, lexical `-reservationNumber`
// sort equals numeric sort. The `unique` index on the column is the final guard
// against a race producing a duplicate.
const generateReservationNumber: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || data.reservationNumber) return data
  const p = warsawParts(new Date())
  const prefix = `ADC-${p.year}${String(p.month + 1).padStart(2, '0')}-`
  let seq = 1
  try {
    const { docs } = await req.payload.find({
      collection: 'reservations',
      where: { reservationNumber: { contains: prefix } },
      sort: '-reservationNumber',
      limit: 1,
      depth: 0,
      req,
    })
    const last = docs[0]?.reservationNumber as string | undefined
    if (last) {
      const n = parseInt(last.slice(prefix.length), 10)
      if (!Number.isNaN(n)) seq = n + 1
    }
  } catch {
    // Never block a create on the lookup failing — fall back to NNNN=0001 and
    // let the unique index reject a genuine collision.
  }
  data.reservationNumber = `${prefix}${String(seq).padStart(4, '0')}`
  return data
}

// Moderation endpoints (spec §5). Admin-only; mounted under /api/reservations.
type ActionFn = (payload: import('payload').Payload, id: string) => Promise<unknown>
function actionEndpoint(path: string, action: ActionFn): Endpoint {
  return {
    path,
    method: 'post',
    handler: async (req) => {
      if (!req.user) throw new APIError('Unauthorized', 401)
      const id = req.routeParams?.id as string
      try {
        const result = await action(req.payload, id)
        return Response.json({ ok: true, reservation: result })
      } catch (err) {
        req.payload.logger.error(
          `Reservation action ${path} failed: ${err instanceof Error ? err.message : err}`,
        )
        return Response.json(
          { ok: false, error: err instanceof Error ? err.message : 'Action failed' },
          { status: 502 },
        )
      }
    },
  }
}

export const Reservations: CollectionConfig = {
  slug: 'reservations',
  admin: {
    useAsTitle: 'reservationNumber',
    defaultColumns: [
      'reservationNumber',
      'date',
      'option',
      'guests',
      'lastName',
      'status',
      'paymentStatus',
      'amount',
    ],
    description:
      'Rezerwacje stolików i biletów. Publiczny zapis idzie przez dedykowane route handlery ' +
      '(/api/reservations, /api/payu/notify), nie przez Payload REST. Limit pojemności jest miękki — ' +
      'online nie blokuje, przekroczenie widać tutaj.',
    group: 'Rezerwacje',
  },
  // Same posture as Events: public has no direct access; writes happen through
  // dedicated route handlers that run server-side with overrideAccess.
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  endpoints: [
    actionEndpoint('/:id/approve', approveReservation),
    actionEndpoint('/:id/reject', rejectReservation),
    actionEndpoint('/:id/cancel', cancelReservation),
    // Soft-capacity usage for this reservation's event (spec §5/§9a). Sums guests
    // of all non-terminal reservations; the UI flags overage in red.
    {
      path: '/:id/capacity',
      method: 'get',
      handler: async (req) => {
        if (!req.user) throw new APIError('Unauthorized', 401)
        const reservation = await req.payload.findByID({
          collection: 'reservations',
          id: req.routeParams?.id as string,
          depth: 0,
        })
        const eventId =
          typeof reservation.event === 'object' ? reservation.event?.id : reservation.event
        if (!eventId) return Response.json({ used: 0, capacity: null, over: false })

        const event = await req.payload.findByID({ collection: 'events', id: eventId, depth: 0 })
        const settings = await req.payload.findGlobal({ slug: 'reservation-settings' })
        const capacity =
          (event.capacity as number | null | undefined) ??
          (settings?.defaultCapacity as number | null | undefined) ??
          null

        const { docs } = await req.payload.find({
          collection: 'reservations',
          where: {
            and: [
              { event: { equals: eventId } },
              { status: { in: ['awaiting_payment', 'awaiting_approval', 'confirmed'] } },
            ],
          },
          limit: 1000,
          depth: 0,
        })
        const used = docs.reduce((sum, d) => sum + (Number(d.guests) || 0), 0)
        return Response.json({
          used,
          capacity,
          over: capacity != null && used > capacity,
        })
      },
    },
  ],
  fields: [
    // Moderation action buttons (Zatwierdź / Odrzuć+zwrot / Zwróć i anuluj).
    {
      name: 'moderation',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/ReservationActions#ReservationActions',
        },
      },
    },
    {
      name: 'reservationNumber',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Auto-generowany: ADC-RRRRMM-NNNN (licznik resetuje się co miesiąc).',
      },
    },

    // ── Wydarzenie + snapshot ────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'event',
          type: 'relationship',
          relationTo: 'events',
          admin: { width: '50%' },
        },
        {
          name: 'date',
          type: 'date',
          admin: {
            width: '50%',
            description: 'Snapshot daty/godziny wydarzenia (Europe/Warsaw).',
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'option',
          type: 'select',
          options: [
            { label: 'Otwarcie wieczoru (darmowy stolik)', value: 'opening' },
            { label: 'Koncert (bilet)', value: 'concert' },
            { label: 'Wieczór klubowy (darmowy stolik)', value: 'club' },
          ],
          admin: { width: '34%' },
        },
        { name: 'slotStart', type: 'text', admin: { width: '33%', placeholder: '18:00' } },
        { name: 'slotEnd', type: 'text', admin: { width: '33%', placeholder: '20:00' } },
      ],
    },
    {
      name: 'guests',
      type: 'number',
      min: 1,
      defaultValue: 1,
      admin: { description: 'Liczba osób.' },
    },

    // ── Dane klienta ─────────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        { name: 'firstName', type: 'text', admin: { width: '50%' } },
        { name: 'lastName', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', admin: { width: '50%' } },
        { name: 'email', type: 'email', admin: { width: '50%' } },
      ],
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'pl',
      options: [
        { label: 'Polski', value: 'pl' },
        { label: 'English', value: 'en' },
      ],
      admin: { description: 'Język rezerwacji — steruje językiem powiadomień (SMS/e-mail).' },
    },

    // ── Zgody / RODO ─────────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'consentTerms',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            width: '50%',
            description: 'Regulamin + przetwarzanie danych do realizacji rezerwacji (wymagane).',
          },
        },
        {
          name: 'consentNewsletter',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '50%', description: 'Zgoda na newsletter (MailerLite).' },
        },
      ],
    },

    // ── Stany ────────────────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          defaultValue: 'awaiting_approval',
          options: [
            { label: 'Oczekuje na płatność', value: 'awaiting_payment' },
            { label: 'Oczekuje na zatwierdzenie', value: 'awaiting_approval' },
            { label: 'Zatwierdzona', value: 'confirmed' },
            { label: 'Odrzucona', value: 'rejected' },
            { label: 'Anulowana', value: 'cancelled' },
            { label: 'Porzucona', value: 'abandoned' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'paymentStatus',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'Brak (darmowa)', value: 'none' },
            { label: 'W toku', value: 'pending' },
            { label: 'Opłacona', value: 'paid' },
            { label: 'Zwrócona', value: 'refunded' },
            { label: 'Nieudana', value: 'failed' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'amount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Kwota w PLN = pricePerPerson × liczba osób (koncert), w pozostałych przypadkach 0.',
      },
    },

    // ── PayU ─────────────────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        { name: 'payuOrderId', type: 'text', admin: { width: '50%', readOnly: true } },
        { name: 'payuRefundId', type: 'text', admin: { width: '50%', readOnly: true } },
      ],
    },

    { name: 'adminNote', type: 'textarea', admin: { description: 'Notatka obsługi (wewnętrzna).' } },
    {
      name: 'anonymizedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description:
          'Ustawiane przez cron retencji — dane osobowe (imię/nazwisko/telefon/e-mail) zostały zanonimizowane 12 miesięcy po wydarzeniu. Rekord pozostaje dla statystyk/księgowości (§7).',
      },
    },
  ],
  hooks: {
    beforeChange: [generateReservationNumber],
  },
  timestamps: true,
}
