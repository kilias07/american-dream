import { getSecret } from './env'

// SMSAPI.pl REST client (spec §6). Docs: https://www.smsapi.pl/docs
// Sent on reservation confirmation and cancellation, for BOTH free and paid
// reservations (decision §9b, 2026-06-08).
//
// Secrets:
//   SMSAPI_TOKEN    OAuth access token (Bearer)
//   SMSAPI_SENDER   Branded sender name (optional). Until the branded sender is
//                   approved by operators (lead time of a few days), leave unset
//                   and SMSAPI falls back to its default/eco sender.

export type SmsResult = { sent: boolean; skipped?: boolean; id?: string; error?: string }

export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const token = getSecret('SMSAPI_TOKEN')
  if (!token) {
    console.warn(JSON.stringify({ level: 'warn', msg: 'SMSAPI not configured — SMS skipped', to }))
    return { sent: false, skipped: true }
  }

  const params = new URLSearchParams({
    to,
    message,
    format: 'json',
    encoding: 'utf-8',
  })
  const sender = getSecret('SMSAPI_SENDER')
  if (sender) params.set('from', sender)

  try {
    const res = await fetch('https://api.smsapi.pl/sms.do', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })
    const data = (await res.json().catch(() => ({}))) as {
      error?: number
      message?: string
      list?: Array<{ id?: string }>
    }
    if (!res.ok || data.error) {
      return { sent: false, error: `SMSAPI error ${data.error ?? res.status}: ${data.message ?? ''}` }
    }
    return { sent: true, id: data.list?.[0]?.id }
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : 'SMSAPI request failed' }
  }
}
