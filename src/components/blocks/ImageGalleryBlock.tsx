import React from 'react'
import Image from 'next/image'
import type { Media, Page } from '@/payload-types'

type ImageGalleryData = Extract<NonNullable<Page['layout']>[number], { blockType: 'imageGallery' }>

function isMedia(value: number | Media): value is Media {
  return typeof value === 'object'
}

export function ImageGalleryBlock({ block }: { block: ImageGalleryData }) {
  const { images } = block

  return (
    <section style={{ padding: '2rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        {images.map((item, i) => {
          const media = isMedia(item.image) ? item.image : null
          if (!media?.url) return null

          return (
            <figure key={item.id ?? i} style={{ margin: 0 }}>
              <Image
                src={media.url}
                alt={media.alt || item.caption || ''}
                width={media.width ?? 400}
                height={media.height ?? 300}
                style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                unoptimized
              />
              {item.caption && (
                <figcaption style={{ padding: '0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
                  {item.caption}
                </figcaption>
              )}
            </figure>
          )
        })}
      </div>
    </section>
  )
}
