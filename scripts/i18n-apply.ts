/**
 * Write translated CMS content into the de / fr / es locales.
 *
 * Reads the Polish doc, swaps every translatable string through the dictionary
 * in i18n/<locale>.json, and saves it back under the target locale. Payload
 * stores localized content as separate rows keyed by `_locale`, so this creates
 * the missing language rows rather than overwriting Polish.
 *
 * Idempotent: re-running with a fuller dictionary just fills more gaps.
 *
 * PAGES ARE EXCLUDED. A page's `layout` is a localized blocks field, and Payload
 * rewrites every locale of such a field on each save — on D1, where these writes
 * are not transactional, a hiccup mid-write leaves Polish or English rows
 * deleted and not restored. Pages go through scripts/i18n-apply-pages.mjs
 * instead, which only ever inserts. Pass --with-pages to override.
 *
 * Run: pnpm exec tsx scripts/i18n-apply.ts [locale...] [--dry] [--only=slug]
 */
import 'dotenv/config'
import { existsSync, readFileSync } from 'node:fs'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import { walkFields, stripMeta } from './i18n-lib'

const SOURCE_LOCALE = 'pl'
const ALL_TARGETS = ['de', 'fr', 'es'] as const

/**
 * D1 occasionally answers a write with a transient "internal error". Payload
 * does not run these updates in a transaction, so a failure can leave rows
 * deleted but not yet re-inserted. Retrying the identical write both completes
 * it and restores whatever the failed attempt removed — so never give up after
 * a single attempt.
 */
async function withRetry<T>(what: string, fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const msg = (err as Error).message ?? ''
      // A validation failure will fail identically every time; don't hammer it.
      if (/invalid/i.test(msg)) break
      if (attempt < 4) {
        console.log(`  … retry ${attempt}/3 ${what}`)
        await new Promise((r) => setTimeout(r, 1000 * attempt))
      }
    }
  }
  throw lastErr
}

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const only = args.find((a) => a.startsWith('--only='))?.slice(7)
const withPages = args.includes('--with-pages')
const targets = args.filter((a) => !a.startsWith('-'))
const locales = targets.length ? targets : [...ALL_TARGETS]

async function main() {
  const payload = await getPayload({ config: configPromise })
  const config = await configPromise

  for (const locale of locales) {
    const path = `i18n/${locale}.json`
    if (!existsSync(path)) {
      console.log(`! ${path} missing — skipped`)
      continue
    }
    const dict = JSON.parse(readFileSync(path, 'utf8')) as Record<string, string>

    /**
     * The Polish copy carries non-breaking spaces (from the typographic orphan
     * fix) and the odd U+2028, which a dictionary written by hand will not
     * reproduce byte-for-byte. Match on whitespace-normalised text so those
     * variants resolve to the same entry.
     */
    const norm = (s: string) => s.replace(/\s+/gu, ' ').trim()
    const byNorm = new Map<string, string>()
    for (const [k, v] of Object.entries(dict)) byNorm.set(norm(k), v)

    let hits = 0
    let visits = 0
    const misses = new Set<string>()
    const translate = (s: string): string | undefined => {
      visits++
      const found = dict[s.trim()] ?? byNorm.get(norm(s))
      if (found) {
        hits++
        // Preserve the original's surrounding whitespace.
        return s.replace(s.trim(), found)
      }
      misses.add(s.trim())
      return undefined // leave the source text in place
    }

    console.log(`\n=== ${locale} (${Object.keys(dict).length} entries) ===`)

    for (const collection of config.collections) {
      if (['users', 'media', 'payload-migrations', 'reservations', 'artist-applications'].includes(collection.slug))
        continue
      if (collection.slug === 'pages' && !withPages && only !== 'pages') continue
      if (only && collection.slug !== only) continue
      let docs: Record<string, unknown>[] = []
      try {
        const res = await payload.find({
          collection: collection.slug as never,
          locale: SOURCE_LOCALE as never,
          depth: 0,
          limit: 1000,
          pagination: false,
          draft: false,
        })
        docs = res.docs as Record<string, unknown>[]
      } catch {
        continue
      }
      let n = 0
      let skipped = 0
      for (const doc of docs) {
        const before = visits
        const data = walkFields(collection.fields, doc, translate, false, { newRowIds: true }) as Record<string, unknown>
        // An empty draft (no title, no content) has nothing to translate, and
        // writing it back only trips required-field validation.
        if (visits === before) { skipped++; continue }
        if (dry) { n++; continue }
        try {
          await withRetry(`${collection.slug}#${doc.id}`, () =>
            payload.update({
              collection: collection.slug as never,
              id: doc.id as never,
              locale: locale as never,
              data: stripMeta(data) as never,
              depth: 0,
              context: { skipRevalidate: true },
            }),
          )
          n++
        } catch (err) {
          console.error(`  x ${collection.slug}#${doc.id}: ${(err as Error).message}`)
        }
      }
      if (n || skipped) console.log(`  ${collection.slug}: ${n}${skipped ? ` (${skipped} empty, skipped)` : ''}`)
    }

    for (const global of config.globals) {
      if (only && global.slug !== only) continue
      try {
        const doc = (await payload.findGlobal({
          slug: global.slug as never,
          locale: SOURCE_LOCALE as never,
          depth: 0,
        })) as Record<string, unknown>
        const data = walkFields(global.fields, doc, translate, false, { newRowIds: true }) as Record<string, unknown>
        if (!dry) {
          await withRetry(`@${global.slug}`, () =>
            payload.updateGlobal({
              slug: global.slug as never,
              locale: locale as never,
              data: stripMeta(data) as never,
              depth: 0,
              context: { skipRevalidate: true },
            }),
          )
        }
        console.log(`  @${global.slug}`)
      } catch (err) {
        console.error(`  x @${global.slug}: ${(err as Error).message}`)
      }
    }

    console.log(`  -> ${visits} visited, ${hits} strings translated, ${misses.size} without an entry`)
    if (misses.size && misses.size < 30) {
      for (const m of [...misses].slice(0, 30)) console.log(`     miss: ${m.slice(0, 80)}`)
    }
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
