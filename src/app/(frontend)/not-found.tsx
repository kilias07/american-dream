'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/**
 * Audit: no dedicated 404 page. Any path that matches no route is redirected
 * one level up (e.g. /events/foo/bar → /events/foo → … → /events → /), which
 * lands on the nearest existing category or, ultimately, the home page.
 *
 * Most unknown URLs are already handled server-side: single-segment paths hit
 * `[slug]` (→ home) and known sections (`events/[slug]`, `news/[slug]`) redirect
 * up via `redirect()`. This boundary only catches deeper unmatched paths, so a
 * client-side "up one level" hop is an acceptable last resort.
 */
export default function NotFound(): null {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const segments = (pathname || '/').split('/').filter(Boolean)
    segments.pop()
    const parent = segments.length ? `/${segments.join('/')}` : '/'
    router.replace(parent)
  }, [pathname, router])

  return null
}
