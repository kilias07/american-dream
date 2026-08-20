import { MEDIA_ORIGIN, isUploadPath, mediaUrl } from './utilities/mediaUrl'

type LoaderProps = {
  src: string
  width: number
  quality?: number
}

/**
 * Next.js image loader backed by Cloudflare Image Transformations.
 *
 * `sharp` cannot run in the Workers runtime, so Next itself can never resize
 * anything here. Cloudflare does it at the edge instead: a request to
 * `/cdn-cgi/image/<options>/<source>` returns the source resized and re-encoded,
 * with `format=auto` picking AVIF or WebP from the browser's Accept header.
 *
 * Uploads are transformed on the media hostname so the source comes straight
 * from R2 — the Worker is not involved and the result is CDN-cached. Anything
 * else same-origin is transformed on the main zone.
 *
 * Requires Transformations to be enabled for the zone (Cloudflare dashboard →
 * Images → Transformations). Without it every URL here 404s.
 */
export default function cloudflareLoader({ src, width, quality }: LoaderProps): string {
  // SVG and inline data have nothing to gain and CF refuses to resize them.
  if (src.startsWith('data:') || src.endsWith('.svg')) return src

  const options = `width=${width},quality=${quality ?? 80},format=auto`

  if (isUploadPath(src)) {
    const absolute = mediaUrl(src) as string
    // `absolute` is MEDIA_ORIGIN + '/' + filename; keep the encoded filename.
    const path = absolute.slice(MEDIA_ORIGIN.length)
    return `${MEDIA_ORIGIN}/cdn-cgi/image/${options}${path}`
  }

  // Other same-origin assets (static files under /public).
  if (src.startsWith('/')) return `/cdn-cgi/image/${options}${src}`

  // Remote images: leave them alone rather than proxying someone else's origin.
  return src
}
