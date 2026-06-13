/**
 * SEO audit — rewrite internal `url` strings in the `header` and `footer`
 * globals to the new English URL scheme, for both PL and EN locales.
 * Run with: pnpm exec tsx scripts/update-nav-urls.ts
 *
 * Idempotent: only replaces exact known old values (see URL_MAP). Walks the
 * global data tree and rewrites every string under a `url` key.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

const URL_MAP: Record<string, string> = {
  '/restauracja': '/restaurant',
  '/bar': '/bar-and-cocktails',
  '/cigar-room': '/cigar-lounge',
  '/twoje-wydarzenie': '/business',
  '/kontakt': '/contact',
  '/polityka-prywatnosci': '/privacy',
  '/program': '/events',
  '/aktualnosci': '/news',
}

const LOCALES = ['pl', 'en'] as const
const GLOBALS = ['header', 'footer'] as const

let changes = 0

// Recursively rewrite any value stored under a `url` key (and similarly-named
// CTA url keys) when it exactly matches a known old value.
function rewrite(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(rewrite)
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      const isUrlKey = key === 'url' || /url$/i.test(key)
      if (isUrlKey && typeof value === 'string' && URL_MAP[value]) {
        out[key] = URL_MAP[value]
        changes++
      } else {
        out[key] = rewrite(value)
      }
    }
    return out
  }
  return node
}

async function run() {
  const payload = await getPayload({ config: configPromise })
  const log = (m: string) => payload.logger.info(m)

  for (const slug of GLOBALS) {
    for (const locale of LOCALES) {
      const before = changes
      const data = await payload.findGlobal({
        slug: slug as 'header',
        locale,
        depth: 0,
      })
      const rewritten = rewrite(data) as Record<string, unknown>
      await payload.updateGlobal({
        slug: slug as 'header',
        locale,
        data: rewritten as never,
      })
      log(`✔ ${slug} [${locale}] — ${changes - before} url(s) rewritten`)
    }
  }

  log(`Done. ${changes} url(s) rewritten in total.`)
  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
