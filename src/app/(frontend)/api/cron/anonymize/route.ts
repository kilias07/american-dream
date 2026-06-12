import { getPayload } from 'payload'
import config from '@payload-config'
import { anonymizeExpiredReservations } from '@/lib/reservations/anonymize'
import { getSecret } from '@/lib/integrations/env'

// Retention cron endpoint (spec §7). Guarded by CRON_SECRET. Invoked by a
// Cloudflare Cron Trigger (see wrangler.jsonc) or any scheduler that can send
// the secret. Accepts the secret as `Authorization: Bearer <secret>` or `?secret=`.

function authorized(request: Request): boolean {
  const secret = getSecret('CRON_SECRET')
  if (!secret) return false
  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  return new URL(request.url).searchParams.get('secret') === secret
}

async function handle(request: Request): Promise<Response> {
  if (!authorized(request)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  const payload = await getPayload({ config })
  try {
    const result = await anonymizeExpiredReservations(payload)
    payload.logger.info(`Reservation anonymization: ${result.anonymized} record(s) processed`)
    return Response.json({ ok: true, ...result })
  } catch (err) {
    payload.logger.error(`Anonymization cron failed: ${err instanceof Error ? err.message : err}`)
    return Response.json({ ok: false, error: 'Anonymization failed' }, { status: 500 })
  }
}

export const POST = handle
export const GET = handle
