import type { EmailAdapter } from 'payload'
import { getBinding } from './env'

// Cloudflare Email Service adapter (spec §6). A thin Payload email adapter that
// sends through the `SEND_EMAIL` worker binding (public-beta Email Sending,
// delivers to arbitrary recipients). SMTP/nodemailer do not run on Workers, so
// everything goes through the binding.
//
// Setup required outside the code (long lead-time — run in parallel):
//   • wrangler.jsonc: add the `send_email` binding named SEND_EMAIL
//   • DNS for americandreamclub.pl: SPF + DKIM
//   • inbound rezerwacja@ via Email Routing
//
// Until the binding is provisioned the adapter logs and no-ops gracefully, so
// the reservation flow is never blocked by missing email.

type CloudflareEmailBinding = {
  send: (message: unknown) => Promise<void>
}

/** Coerce Payload's loose recipient shape (string | string[] | …) to addresses. */
function toRecipients(to: unknown): string[] {
  if (typeof to === 'string') return [to]
  if (Array.isArray(to)) return to.map((t) => (typeof t === 'string' ? t : String(t)))
  return to ? [String(to)] : []
}

function bareAddress(value: string): string {
  const match = value.match(/<([^>]+)>/)
  return (match?.[1] || value).trim()
}

function encodeSubject(subject: string): string {
  // RFC 2047 encoded-word so Polish characters survive in the Subject header.
  const base64 = Buffer.from(subject, 'utf-8').toString('base64')
  return `=?UTF-8?B?${base64}?=`
}

function buildMime(args: { fromHeader: string; to: string; subject: string; html: string }): string {
  const body = Buffer.from(args.html, 'utf-8').toString('base64')
  return [
    `From: ${args.fromHeader}`,
    `To: ${args.to}`,
    `Subject: ${encodeSubject(args.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: base64',
    '',
    body,
  ].join('\r\n')
}

export function cloudflareEmailAdapter(opts: {
  defaultFromAddress: string
  defaultFromName: string
}): EmailAdapter {
  // Payload calls this factory with { payload }; we don't need the instance.
  return () => ({
    name: 'cloudflare-email',
    defaultFromAddress: opts.defaultFromAddress,
    defaultFromName: opts.defaultFromName,
    async sendEmail(message): Promise<unknown> {
      const fromValue =
        (typeof message.from === 'string' && message.from) ||
        `${opts.defaultFromName} <${opts.defaultFromAddress}>`
      const fromAddr = bareAddress(fromValue)
      const recipients = toRecipients(message.to)
      const subject = typeof message.subject === 'string' ? message.subject : ''
      const html =
        (typeof message.html === 'string' && message.html) ||
        (typeof message.text === 'string' && message.text) ||
        ''

      const binding = getBinding<CloudflareEmailBinding>('SEND_EMAIL')
      if (!binding) {
        console.warn(
          JSON.stringify({
            level: 'warn',
            msg: 'SEND_EMAIL binding not configured — email logged, not sent',
            to: recipients,
            subject,
          }),
        )
        return { skipped: true }
      }

      // `cloudflare:email` is a workerd built-in — dynamic import keeps the
      // bundler from trying to resolve it at build time.
      const { EmailMessage } = (await import(
        /* webpackIgnore: true */ 'cloudflare:email'
      )) as { EmailMessage: new (from: string, to: string, raw: string) => unknown }

      for (const to of recipients) {
        const toAddr = bareAddress(to)
        const raw = buildMime({ fromHeader: fromValue, to: toAddr, subject, html })
        await binding.send(new EmailMessage(fromAddr, toAddr, raw))
      }
      return { sent: true }
    },
  })
}
