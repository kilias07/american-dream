import React from 'react'

/**
 * Turns the address an editor copied from YouTube or Vimeo into an embeddable
 * one. Returns null for anything it doesn't recognise, so a mistyped link
 * renders nothing rather than a broken frame.
 *
 * YouTube goes through `youtube-nocookie.com`: the club runs a cookie-consent
 * banner, and the ordinary youtube.com player drops tracking cookies the moment
 * the page loads — before the visitor has agreed to anything. The nocookie host
 * holds off until the video is actually played.
 */
export function toEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, '')

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1)
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    const id =
      url.searchParams.get('v') ??
      url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] ??
      null
    if (!id) return null
    // Keep a start time if the editor copied the link at a given moment.
    const start = url.searchParams.get('t') ?? url.searchParams.get('start')
    const seconds = start ? String(start).replace(/[^0-9]/g, '') : ''
    return `https://www.youtube-nocookie.com/embed/${id}${seconds ? `?start=${seconds}` : ''}`
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.match(/(\d+)/)?.[1]
    return id ? `https://player.vimeo.com/video/${id}` : null
  }
  return null
}

export function VideoEmbed({
  url,
  caption,
  title,
}: {
  url: string | null | undefined
  caption?: string | null
  title?: string | null
}) {
  const src = toEmbedUrl(url)
  if (!src) return null

  return (
    <figure className="my-8">
      <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-white/15 bg-black">
        <iframe
          src={src}
          title={title || caption || 'Odtwarzacz wideo'}
          loading="lazy"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-sm text-white/60 text-center">{caption}</figcaption>
      )}
    </figure>
  )
}
