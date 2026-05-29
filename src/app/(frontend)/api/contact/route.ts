import { getPayload } from 'payload'
import config from '@payload-config'

type ContactPayload = {
  name?: string
  phone?: string
  email?: string
  message?: string
  consent?: boolean
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  let body: ContactPayload

  try {
    body = (await request.json()) as ContactPayload
  } catch {
    return Response.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, phone, email, message, consent } = body

  if (!email || !EMAIL_REGEX.test(email)) {
    return Response.json({ ok: false, error: 'A valid email address is required' }, { status: 400 })
  }

  if (!consent) {
    return Response.json({ ok: false, error: 'Consent is required' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })

    // TODO: wire email/Form Builder submission — no email adapter is configured yet,
    // so submissions are logged for now as a graceful placeholder.
    payload.logger.info(
      `Contact form submission — email: ${email}` +
        (name ? `, name: ${name}` : '') +
        (phone ? `, phone: ${phone}` : '') +
        (message ? `, message: ${message}` : ''),
    )

    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false, error: 'Failed to submit contact form' }, { status: 500 })
  }
}
