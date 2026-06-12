import { getSecret } from './env'

// MailerLite REST client (spec §6/§7). Docs: https://developers.mailerlite.com
// Newsletter opt-in from the reservation popup and the site footer feed a
// MailerLite group. Best-effort: a missing config or API error never blocks the
// reservation flow.
//
// Secrets:
//   MAILERLITE_API_KEY    Bearer API key
//   MAILERLITE_GROUP_ID   Target group id for new subscribers (optional)

export type SubscribeResult = { subscribed: boolean; skipped?: boolean; error?: string }

export async function subscribeToNewsletter(
  email: string,
  name?: string,
  locale?: 'pl' | 'en',
): Promise<SubscribeResult> {
  const apiKey = getSecret('MAILERLITE_API_KEY')
  if (!apiKey) {
    console.warn(
      JSON.stringify({ level: 'warn', msg: 'MailerLite not configured — subscribe skipped', email }),
    )
    return { subscribed: false, skipped: true }
  }

  const groupId = getSecret('MAILERLITE_GROUP_ID')
  const body: Record<string, unknown> = { email }
  if (name) body.fields = { name }
  if (locale) body.fields = { ...(body.fields as object), language: locale }
  if (groupId) body.groups = [groupId]

  try {
    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      return { subscribed: false, error: `MailerLite error ${res.status}: ${await res.text()}` }
    }
    return { subscribed: true }
  } catch (err) {
    return { subscribed: false, error: err instanceof Error ? err.message : 'MailerLite request failed' }
  }
}
