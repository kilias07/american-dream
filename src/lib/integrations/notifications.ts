import type { Payload } from 'payload'
import type { Reservation } from '@/payload-types'
import { sendSms } from './sms'

// Notification composition for the reservation system (spec §5/§6). Staff get an
// e-mail on every new reservation; clients get SMS + e-mail on confirmation and
// cancellation/rejection (SMS for free AND paid — decision §9b). All sends are
// best-effort: a failure is logged, never thrown, so moderation never breaks.
//
// NOTE: client message templates are inlined bilingually here. They can be moved
// into the `reservation-settings` global later without touching call sites.

type ResLocale = 'pl' | 'en'

const t = (locale: ResLocale | null | undefined, pl: string, en: string) =>
  locale === 'en' ? en : pl

const OPTION_LABEL: Record<string, { pl: string; en: string }> = {
  opening: { pl: 'Otwarcie wieczoru (stolik)', en: 'Evening opening (table)' },
  concert: { pl: 'Koncert (bilet)', en: 'Concert (ticket)' },
  club: { pl: 'Wieczór klubowy (stolik)', en: 'Club night (table)' },
}

function formatDate(date: string | null | undefined, locale: ResLocale): string {
  if (!date) return ''
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pl-PL', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Europe/Warsaw',
    }).format(new Date(date))
  } catch {
    return date
  }
}

function optionLabel(option: string | null | undefined, locale: ResLocale): string {
  const entry = option ? OPTION_LABEL[option] : undefined
  return entry ? t(locale, entry.pl, entry.en) : (option ?? '')
}

function clientName(r: Reservation): string {
  return [r.firstName, r.lastName].filter(Boolean).join(' ').trim()
}

// ── Staff ────────────────────────────────────────────────────────────────────

export async function notifyStaffNewReservation(payload: Payload, r: Reservation): Promise<void> {
  try {
    const settings = await payload.findGlobal({ slug: 'reservation-settings' })
    const to = (settings?.notificationEmail as string) || 'rezerwacja@americandreamclub.pl'
    const paid = (r.amount ?? 0) > 0
    const rows: Array<[string, string]> = [
      ['Numer', r.reservationNumber ?? ''],
      ['Termin', formatDate(r.date, 'pl')],
      ['Opcja', optionLabel(r.option, 'pl')],
      ['Godziny', [r.slotStart, r.slotEnd].filter(Boolean).join('–')],
      ['Liczba osób', String(r.guests ?? '')],
      ['Klient', clientName(r)],
      ['Telefon', r.phone ?? ''],
      ['E-mail', r.email ?? ''],
      ['Kwota', paid ? `${r.amount} PLN` : 'bezpłatna'],
      ['Status płatności', r.paymentStatus ?? 'none'],
    ]
    const html =
      `<h2>Nowa rezerwacja ${r.reservationNumber ?? ''}</h2>` +
      '<table cellpadding="6" style="border-collapse:collapse">' +
      rows
        .map(
          ([k, v]) =>
            `<tr><td style="border:1px solid #ddd"><strong>${k}</strong></td><td style="border:1px solid #ddd">${v}</td></tr>`,
        )
        .join('') +
      '</table>' +
      '<p>Wymaga ręcznej akceptacji w panelu CMS.</p>'

    await payload.sendEmail({ to, subject: `Nowa rezerwacja ${r.reservationNumber ?? ''}`, html })
  } catch (err) {
    payload.logger.error(`notifyStaffNewReservation failed: ${err instanceof Error ? err.message : err}`)
  }
}

// ── Client ─────────────────────────────────────────────────────────────────--

export async function notifyClientConfirmed(payload: Payload, r: Reservation): Promise<void> {
  const locale = (r.locale as ResLocale) ?? 'pl'
  const when = formatDate(r.date, locale)
  const opt = optionLabel(r.option, locale)
  const sms = t(
    locale,
    `American Dream Club: rezerwacja ${r.reservationNumber} potwierdzona. ${opt}, ${when}. Do zobaczenia!`,
    `American Dream Club: reservation ${r.reservationNumber} confirmed. ${opt}, ${when}. See you!`,
  )
  const subject = t(
    locale,
    `Rezerwacja ${r.reservationNumber} potwierdzona`,
    `Reservation ${r.reservationNumber} confirmed`,
  )
  const html = t(
    locale,
    `<p>Dzień dobry${clientName(r) ? ' ' + clientName(r) : ''},</p><p>Twoja rezerwacja <strong>${r.reservationNumber}</strong> została potwierdzona.</p><p>${opt}<br/>${when}<br/>Liczba osób: ${r.guests}</p><p>Do zobaczenia w American Dream Club!</p>`,
    `<p>Hello${clientName(r) ? ' ' + clientName(r) : ''},</p><p>Your reservation <strong>${r.reservationNumber}</strong> has been confirmed.</p><p>${opt}<br/>${when}<br/>Guests: ${r.guests}</p><p>See you at American Dream Club!</p>`,
  )
  await sendClient(payload, r, sms, subject, html)
}

export async function notifyClientCancelled(
  payload: Payload,
  r: Reservation,
  opts: { refunded?: boolean } = {},
): Promise<void> {
  const locale = (r.locale as ResLocale) ?? 'pl'
  const refundNote = opts.refunded
    ? t(locale, ' Środki zostaną zwrócone.', ' Your payment will be refunded.')
    : ''
  const sms = t(
    locale,
    `American Dream Club: rezerwacja ${r.reservationNumber} została anulowana.${refundNote}`,
    `American Dream Club: reservation ${r.reservationNumber} has been cancelled.${refundNote}`,
  )
  const subject = t(
    locale,
    `Rezerwacja ${r.reservationNumber} anulowana`,
    `Reservation ${r.reservationNumber} cancelled`,
  )
  const html = t(
    locale,
    `<p>Twoja rezerwacja <strong>${r.reservationNumber}</strong> została anulowana.${refundNote}</p>`,
    `<p>Your reservation <strong>${r.reservationNumber}</strong> has been cancelled.${refundNote}</p>`,
  )
  await sendClient(payload, r, sms, subject, html)
}

export async function notifyClientRejected(
  payload: Payload,
  r: Reservation,
  opts: { refunded?: boolean } = {},
): Promise<void> {
  const locale = (r.locale as ResLocale) ?? 'pl'
  const refundNote = opts.refunded
    ? t(locale, ' Wpłacone środki zwrócimy w całości.', ' We will refund your payment in full.')
    : ''
  const sms = t(
    locale,
    `American Dream Club: niestety nie możemy przyjąć rezerwacji ${r.reservationNumber}.${refundNote}`,
    `American Dream Club: unfortunately we cannot accept reservation ${r.reservationNumber}.${refundNote}`,
  )
  const subject = t(
    locale,
    `Rezerwacja ${r.reservationNumber} — odrzucona`,
    `Reservation ${r.reservationNumber} — rejected`,
  )
  const html = t(
    locale,
    `<p>Niestety nie możemy przyjąć Twojej rezerwacji <strong>${r.reservationNumber}</strong>.${refundNote}</p><p>Przepraszamy za niedogodności.</p>`,
    `<p>Unfortunately we cannot accept your reservation <strong>${r.reservationNumber}</strong>.${refundNote}</p><p>We apologise for the inconvenience.</p>`,
  )
  await sendClient(payload, r, sms, subject, html)
}

async function sendClient(
  payload: Payload,
  r: Reservation,
  sms: string,
  subject: string,
  html: string,
): Promise<void> {
  if (r.phone) {
    const res = await sendSms(r.phone, sms)
    if (res.error) payload.logger.warn(`SMS to ${r.phone} failed: ${res.error}`)
  }
  if (r.email) {
    try {
      await payload.sendEmail({ to: r.email, subject, html })
    } catch (err) {
      payload.logger.error(`client email failed: ${err instanceof Error ? err.message : err}`)
    }
  }
}
