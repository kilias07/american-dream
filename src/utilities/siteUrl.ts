/**
 * Single source of truth for the site's public origin.
 *
 * Everything that leaves the server carrying an absolute URL — canonical,
 * hreflang, og:url, sitemap.xml, llm.txt, robots.txt, JSON-LD — must use this
 * value, never `process.env.NEXT_PUBLIC_SERVER_URL` directly.
 *
 * Why the guard: the Worker answers on BOTH `americandreamclub.pl` and its
 * `*.workers.dev` deployment hostname. When the env var pointed at the
 * workers.dev host (audyt 2026-08-06), every canonical on the real domain
 * pointed at the dev host, so Google saw the whole production site as a
 * duplicate of a staging copy. Rejecting `*.workers.dev` here means a
 * mis-set variable can never reintroduce that, whatever the deploy does.
 */
const CANONICAL_ORIGIN = 'https://americandreamclub.pl'

function resolveSiteUrl(raw: string | undefined): string {
  if (!raw) return CANONICAL_ORIGIN
  try {
    const { origin, hostname } = new URL(raw)
    if (hostname.endsWith('.workers.dev')) return CANONICAL_ORIGIN
    return origin
  } catch {
    return CANONICAL_ORIGIN
  }
}

/** Public origin, no trailing slash (e.g. `https://americandreamclub.pl`). */
export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SERVER_URL)

/** Exported for tests / diagnostics. */
export { CANONICAL_ORIGIN, resolveSiteUrl }
