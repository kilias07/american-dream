/**
 * Pull every translatable string out of the CMS into i18n/source.json.
 *
 * Source locale is Polish — that is where the copy was actually written; the
 * English rows are themselves a translation. Output is deduplicated by string
 * value, so a label repeated across twelve blocks is translated once.
 *
 * Run: pnpm exec tsx scripts/i18n-extract.ts
 */
import 'dotenv/config'
import { writeFileSync, mkdirSync } from 'node:fs'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import { walkFields } from './i18n-lib'

const SOURCE_LOCALE = 'pl'

async function main() {
  const payload = await getPayload({ config: configPromise })
  const config = await configPromise

  const strings = new Map<string, string[]>() // text -> where it was found
  const record = (where: string) => (s: string): string | undefined => {
    const key = s.trim()
    if (!key) return undefined
    const seen = strings.get(key) ?? []
    if (seen.length < 4 && !seen.includes(where)) seen.push(where)
    strings.set(key, seen)
    return undefined // extract mode: never rewrite
  }

  for (const collection of config.collections) {
    if (collection.slug === 'users' || collection.slug === 'media') continue
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
    for (const doc of docs) {
      walkFields(collection.fields, doc, record(`${collection.slug}#${doc.id}`))
    }
    if (docs.length) console.log(`  ${collection.slug}: ${docs.length} docs`)
  }

  for (const global of config.globals) {
    try {
      const doc = (await payload.findGlobal({
        slug: global.slug as never,
        locale: SOURCE_LOCALE as never,
        depth: 0,
      })) as Record<string, unknown>
      walkFields(global.fields, doc, record(`@${global.slug}`))
      console.log(`  @${global.slug}`)
    } catch {
      continue
    }
  }

  const sorted = [...strings.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pl'))
  mkdirSync('i18n', { recursive: true })
  writeFileSync(
    'i18n/source.json',
    JSON.stringify(
      sorted.map(([text, where]) => ({ text, where })),
      null,
      2,
    ) + '\n',
  )

  const chars = sorted.reduce((n, [t]) => n + t.length, 0)
  console.log(`\n${sorted.length} unique strings, ${chars} characters -> i18n/source.json`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
