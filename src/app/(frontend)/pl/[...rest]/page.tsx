import { permanentRedirect } from 'next/navigation'

/**
 * 301 catch-all for legacy `/pl/...` URLs. PL is now the default served at
 * UNPREFIXED paths, so `/pl/<anything>` permanently redirects to `/<anything>`
 * (and `/pl` → `/`). Preserves old indexed `/pl/...` links + their link equity.
 *
 * Note: there is intentionally NO `pl/page.tsx` for the bare `/pl` segment;
 * that case is handled by `pl/[...rest]` not matching → see the sibling
 * redirect below. To also cover bare `/pl`, we add a catch-all that treats an
 * empty rest as the home redirect.
 */
export default async function LegacyPlRedirect({
  params,
}: {
  params: Promise<{ rest?: string[] }>
}) {
  const { rest } = await params
  const tail = (rest ?? []).join('/')
  permanentRedirect(tail ? `/${tail}` : '/')
}
