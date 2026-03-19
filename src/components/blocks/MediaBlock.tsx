import React from 'react'
import Image from 'next/image'
import type { Media, Page } from '@/payload-types'

type MediaBlockData = Extract<NonNullable<Page['layout']>[number], { blockType: 'mediaBlock' }>

function isMedia(value: number | Media): value is Media {
  return typeof value === 'object'
}

export function MediaBlockComponent({ block }: { block: MediaBlockData }) {
  const media = isMedia(block.media) ? block.media : null

  if (!media?.url) return null

  const isVideo = media.mimeType?.startsWith('video/')

  return (
    <section style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {isVideo ? (
        <video src={media.url} controls style={{ width: '100%', display: 'block' }}>
          <track kind="captions" />
        </video>
      ) : (
        <Image
          src={media.url}
          alt={media.alt}
          width={media.width ?? 900}
          height={media.height ?? 600}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          unoptimized
        />
      )}
    </section>
  )
}
