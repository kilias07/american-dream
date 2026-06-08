/**
 * Replace the file behind each existing placeholder Media doc with the real
 * American Dream Club photo now sitting in public/images/placeholders/.
 *
 * The seed created Media docs keyed by filename (home.jpg, restauracja.jpg,
 * musician-1.jpg, …). Every block/item references those docs, so swapping the
 * stored file in-place makes every page show the real photo with NO content
 * re-wiring.
 *
 * Run (local D1/R2):       pnpm run replace-photos
 * Run (remote prod D1/R2): cross-env NODE_ENV=production PAYLOAD_SECRET=ignore tsx scripts/replace-photos.ts
 *
 * Idempotent: re-running just re-uploads the same files.
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const ROOT = process.cwd()
const DIR = path.join(ROOT, 'public/images/placeholders')

// filename (as stored in Media) -> human alt text (kept in sync with seed)
const ALT: Record<string, string> = {
  'home.jpg': 'Klub muzyczny — wnętrze',
  'restauracja.jpg': 'Restauracja — wnętrze',
  'bar.jpg': 'Cocktail bar — koktajl',
  'cigar.jpg': 'Cigar room — wnętrze',
  'program.jpg': 'Koncert na żywo',
  'twoje.jpg': 'Impreza okolicznościowa',
  'single.jpg': 'Wydarzenie muzyczne',
  'special.jpg': 'Wydarzenie specjalne',
  'gallery.jpg': 'Galeria klubu',
  'musician-1.jpg': 'Muzyk',
  'musician-2.jpg': 'Muzyk',
  'musician-3.jpg': 'Muzyk',
  'musician-4.jpg': 'Muzyk',
  'musician-5.jpg': 'Muzyk',
  'musician-6.jpg': 'Muzyk',
}

async function run() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  let updated = 0
  let created = 0
  let missing = 0

  for (const filename of Object.keys(ALT)) {
    const filePath = path.join(DIR, filename)
    if (!fs.existsSync(filePath)) {
      log(`⚠ source file missing on disk: ${filename}`)
      missing++
      continue
    }
    const alt = ALT[filename]
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    })
    if (existing.docs[0]) {
      await payload.update({
        collection: 'media',
        id: existing.docs[0].id,
        data: { alt },
        filePath,
      })
      log(`✓ replaced ${filename} (media id ${existing.docs[0].id})`)
      updated++
    } else {
      const doc = await payload.create({
        collection: 'media',
        data: { alt },
        filePath,
      })
      log(`+ created ${filename} (media id ${doc.id})`)
      created++
    }
  }

  log(`Done. replaced=${updated} created=${created} missing=${missing}`)
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
