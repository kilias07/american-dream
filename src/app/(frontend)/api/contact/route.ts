import { getPayload } from 'payload'
import config from '@payload-config'
import { locales, defaultLocale } from '@/config/locales'

type ContactPayload = {
  name?: string
  phone?: string
  email?: string
  message?: string
  consent?: boolean
  /** newsletter | event | contact — decides how the entry is filed. */
  kind?: string
  /** Recurring series id, for a "notify me" signup. */
  series?: number | string
  locale?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const KINDS = ['newsletter', 'event', 'contact'] as const

export async function POST(request: Request) {
  let body: ContactPayload

  try {
    body = (await request.json()) as ContactPayload
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, phone, email, message, consent, series } = body

  if (!email || !EMAIL_REGEX.test(email)) {
    return Response.json({ ok: false, error: 'A valid email address is required' }, { status: 400 })
  }

  if (!consent) {
    return Response.json({ ok: false, error: 'Consent is required' }, { status: 400 })
  }

  const kind = (KINDS as readonly string[]).includes(body.kind ?? '')
    ? (body.kind as (typeof KINDS)[number])
    : message
      ? 'contact'
      : 'newsletter'
  const locale = (locales as readonly string[]).includes(body.locale ?? '')
    ? body.locale
    : defaultLocale

  try {
    const payload = await getPayload({ config })

    // These used to be written to the worker log and nowhere else, which meant
    // an enquiry was lost unless somebody happened to be tailing the logs.
    // They are stored now; sending mail on top is a separate step and needs the
    // Cloudflare mail binding (see docs/cloudflare-email.md).
    await payload.create({
      collection: 'signups',
      data: {
        kind,
        email,
        name: name || undefined,
        phone: phone || undefined,
        message: message || undefined,
        series: kind === 'event' && series ? Number(series) : undefined,
        locale,
      },
    })

    return Response.json({ ok: true })
  } catch (err) {
    // Never let a storage failure swallow the enquiry silently — at least the
    // log keeps it, as before.
    try {
      const payload = await getPayload({ config })
      payload.logger.error(
        `Signup could not be stored (${(err as Error).message}) — email: ${email}, kind: ${kind}` +
          (message ? `, message: ${message}` : ''),
      )
    } catch {
      /* logging is best-effort */
    }
    return Response.json({ ok: false, error: 'Failed to submit form' }, { status: 500 })
  }
}
