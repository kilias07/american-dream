import type { EmailAdapter } from 'payload'
import { getBinding } from './env'

// Adapter e-mail (spec §6) — łańcuch transportów, pierwszy dostępny wygrywa:
//
//   1. RESEND (HTTPS API, https://resend.com) — gdy ustawiony sekret
//      RESEND_API_KEY. Działa NIEZALEŻNIE od tego, gdzie stoi DNS domeny
//      (wymaga tylko weryfikacji domeny nadawcy w panelu Resend — 3 rekordy
//      DNS u registrara, bez dotykania MX/poczty klubu). Darmowe 3k mail/mies.
//   2. Cloudflare Email Service — binding `SEND_EMAIL` (wymaga strefy domeny
//      na koncie CF + SPF/DKIM; do włączenia przy przeniesieniu domeny).
//   3. Bez obu powyższych: log + no-op (żaden flow, np. reset hasła, nie
//      blokuje się na braku e-maila — ale mail NIE wychodzi).
//
// SMTP/nodemailer nie działają na Workers — stąd wyłącznie HTTP/binding.

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

      // ── 1. Resend (HTTPS) — preferowany, bo niezależny od DNS/strefy CF ────
      const resendKey = process.env.RESEND_API_KEY
      if (resendKey) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromValue,
            to: recipients.map(bareAddress),
            subject,
            html,
          }),
        })
        if (res.ok) return { sent: true, via: 'resend' }
        const detail = await res.text().catch(() => '')
        console.error(
          JSON.stringify({
            level: 'error',
            msg: `Resend API error ${res.status} — trying next transport`,
            detail: detail.slice(0, 300),
            to: recipients,
            subject,
          }),
        )
        // spadamy dalej do bindingu / no-opa
      }

      // ── 2. Cloudflare Email Service (binding SEND_EMAIL) ───────────────────
      const binding = getBinding<CloudflareEmailBinding>('SEND_EMAIL')
      if (!binding) {
        console.warn(
          JSON.stringify({
            level: 'warn',
            msg: resendKey
              ? 'Resend failed and SEND_EMAIL binding not configured — email logged, not sent'
              : 'No email transport (RESEND_API_KEY / SEND_EMAIL) — email logged, not sent',
            to: recipients,
            subject,
          }),
        )
        return { skipped: true }
      }

      // `cloudflare:email` is a workerd built-in. Build the specifier from parts
      // so neither webpack NOR OpenNext's esbuild pass can statically resolve it
      // at bundle time (a string literal makes esbuild error: "Could not resolve
      // cloudflare:email"). At runtime workerd resolves it normally.
      const cfEmailSpecifier = ['cloudflare', 'email'].join(':')
      const { EmailMessage } = (await import(
        /* webpackIgnore: true */ /* @vite-ignore */ cfEmailSpecifier
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
