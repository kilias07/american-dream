/**
 * Single source of truth for where uploaded media is actually served from.
 *
 * Payload stores media URLs as `/api/media/file/<filename>`, which routes every
 * byte through the Worker: no CDN caching, a Worker invocation per image, and
 * Cloudflare's image transformation service cannot use such a URL as a source
 * (a Worker scoped to `/*` intercepts it — CF error 9524).
 *
 * The R2 bucket is published at its own hostname, so mapping those paths onto
 * it gives us CDN caching for free and a transformable source. Falls back to
 * the Payload path if the hostname is ever unset, so nothing 404s.
 */
const DEFAULT_MEDIA_ORIGIN = 'https://media.americandreamclub.pl'

export const MEDIA_ORIGIN = (process.env.NEXT_PUBLIC_MEDIA_URL || DEFAULT_MEDIA_ORIGIN).replace(
  /\/+$/,
  '',
)

const PAYLOAD_FILE_PREFIX = '/api/media/file/'

/** True when `url` is a Payload upload path we can serve straight from R2. */
export function isUploadPath(url: string): boolean {
  return url.startsWith(PAYLOAD_FILE_PREFIX)
}

/**
 * Rewrite a Payload media URL onto the public R2 hostname. Absolute URLs and
 * anything that is not an upload path are returned untouched.
 */
export function mediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url
  if (!isUploadPath(url)) return url
  return `${MEDIA_ORIGIN}/${url.slice(PAYLOAD_FILE_PREFIX.length)}`
}
