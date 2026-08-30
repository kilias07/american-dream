/**
 * Translate the page tree straight in the database.
 *
 * Payload's own update path rewrites every locale of a localized `blocks` field
 * on each save, so writing German can drop Polish or English rows if anything
 * goes wrong mid-write — and on D1 these updates are not transactional. Pages
 * are the only content shaped that way, and they are the site's front door, so
 * they get this narrower path instead: copy the Polish rows, translate the text,
 * insert them under the new locale. Nothing is ever deleted except a previous
 * run's rows for the same target locale, which makes it safely repeatable.
 *
 * Usage: node scripts/i18n-apply-pages.mjs <wrangler-db-args> [locales...]
 *   node scripts/i18n-apply-pages.mjs "D1 --env=staging" de fr es
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

const run = promisify(execFile)
const DB = (process.argv[2] || 'D1 --env=staging').split(/\s+/)
const LOCALES = process.argv.slice(3).length ? process.argv.slice(3) : ['de', 'fr', 'es']
const SOURCE = 'pl'

async function d1(sql) {
  const { stdout } = await run(
    'npx',
    ['wrangler', 'd1', 'execute', ...DB, '--remote', '--json', '--command', sql],
    { maxBuffer: 128 * 1024 * 1024, env: { ...process.env, CI: 'true' } },
  )
  return JSON.parse(stdout.slice(stdout.indexOf('[')))[0].results
}
async function d1File(path) {
  await run('npx', ['wrangler', 'd1', 'execute', ...DB, '--remote', '--yes', '--file', path],
    { maxBuffer: 128 * 1024 * 1024, env: { ...process.env, CI: 'true' } })
}

const lit = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replaceAll("'", "''")}'`)
const newId = () => randomBytes(12).toString('hex')

// ---- dictionary -------------------------------------------------------------
function loadDict(locale) {
  const dict = JSON.parse(readFileSync(`i18n/${locale}.json`, 'utf8'))
  // The Polish copy carries non-breaking spaces from the typographic orphan fix.
  const norm = (s) => s.replace(/\s+/gu, ' ').trim()
  const byNorm = new Map(Object.entries(dict).map(([k, v]) => [norm(k), v]))
  const one = (s) => dict[s.trim()] ?? byNorm.get(norm(s))

  return (value) => {
    if (typeof value !== 'string' || !value.trim()) return value
    // Lexical rich text lives in the column as JSON; translate its leaf nodes.
    if (/^\s*\{/.test(value) && value.includes('"root"')) {
      try {
        const walk = (n) =>
          Array.isArray(n) ? n.map(walk)
          : n && typeof n === 'object'
            ? Object.fromEntries(Object.entries(n).map(([k, v]) =>
                [k, k === 'text' && typeof v === 'string' ? (one(v) ?? v) : walk(v)]))
            : n
        return JSON.stringify(walk(JSON.parse(value)))
      } catch { return value }
    }
    return one(value) ?? value
  }
}

// ---- schema -----------------------------------------------------------------
const ddl = await d1(
  `SELECT name, sql FROM sqlite_master WHERE type='table' AND name LIKE 'pages%' AND name NOT LIKE '_pages_v%'`,
)
const tables = ddl.filter((t) => /[`"]?_locale[`"]?\s+text/i.test(t.sql)).map((t) => t.name)
// Text primary keys are Payload-minted ids we must regenerate per locale;
// integer ones are autoincrement and must be omitted on insert.
const textId = new Set(ddl.filter((t) => /[`"]?id[`"]?\s+text\s+primary key/i.test(t.sql)).map((t) => t.name))

const rows = {}
for (let i = 0; i < tables.length; i += 6) {
  const got = await Promise.all(tables.slice(i, i + 6).map(async (t) => [t, await d1(`SELECT * FROM ${t} WHERE _locale='${SOURCE}'`)]))
  for (const [t, r] of got) rows[t] = r
}

// Parent-first ordering: start at the page ids, then follow each level's ids.
const pageIds = new Set((await d1('SELECT id FROM pages')).map((r) => String(r.id)))
const ordered = []
let known = new Set(pageIds)
let grew = true
while (grew) {
  grew = false
  for (const t of tables) {
    if (ordered.some((o) => o.table === t)) continue
    const mine = (rows[t] || []).filter((r) => known.has(String(r._parent_id)))
    if (!mine.length) continue
    ordered.push({ table: t, rows: mine })
    for (const r of mine) if (r.id != null) { known.add(String(r.id)); grew = true }
  }
}
console.error(`${ordered.length} tables, ${ordered.reduce((n, o) => n + o.rows.length, 0)} source rows`)

// ---- build ------------------------------------------------------------------
const stmts = []
for (const locale of LOCALES) {
  const tr = loadDict(locale)
  const idMap = new Map()
  // Clear only this locale's rows, deepest first, so a re-run is idempotent.
  for (const { table } of [...ordered].reverse()) stmts.push(`DELETE FROM ${table} WHERE _locale='${locale}';`)

  for (const { table, rows: src } of ordered) {
    const cols = Object.keys(src[0]).filter((c) => !(c === 'id' && !textId.has(table)))
    const out = src.map((r) => {
      const o = {}
      for (const c of cols) {
        let v = r[c]
        if (c === '_locale') v = locale
        else if (c === 'id') { const id = newId(); idMap.set(String(r.id), id); v = id }
        else if (c === '_parent_id' && idMap.has(String(v))) v = idMap.get(String(v))
        else if (typeof v === 'string') v = tr(v)
        o[c] = v
      }
      return o
    })
    for (let i = 0; i < out.length; i += 20) {
      stmts.push(
        `INSERT INTO ${table} (${cols.map((c) => `"${c}"`).join(',')}) VALUES ` +
          out.slice(i, i + 20).map((o) => `(${cols.map((c) => lit(o[c])).join(',')})`).join(',') + ';',
      )
    }
  }
  console.error(`${locale}: ${idMap.size} ids remapped`)
}

const file = process.env.SQL_OUT || 'i18n/pages.sql'
writeFileSync(file, stmts.join('\n') + '\n')
console.error(`${stmts.length} statements -> ${file}`)
await d1File(file)
console.error('applied')
