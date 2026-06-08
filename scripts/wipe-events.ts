/**
 * One-off: delete all Events (and clear stale recurring-series so the seed can
 * relink cleanly). Needed before a full re-seed when the target DB already holds
 * an older event set — the "one event per day" validator otherwise trips on the
 * transient collision while events are re-dated one by one.
 *
 * Remote prod: NODE_ENV=production PAYLOAD_FORCE_WRANGLER=true tsx scripts/wipe-events.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function run() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  for (const collection of ['events', 'recurring-series'] as const) {
    const { docs } = await payload.find({ collection, limit: 1000, depth: 0 })
    log(`Deleting ${docs.length} from ${collection}…`)
    for (const d of docs) {
      await payload.delete({ collection, id: (d as { id: number }).id })
    }
  }
  log('Wipe done.')
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
