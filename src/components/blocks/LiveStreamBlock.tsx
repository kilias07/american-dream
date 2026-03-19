import React from 'react'
import type { Page } from '@/payload-types'

type LiveStreamData = Extract<NonNullable<Page['layout']>[number], { blockType: 'liveStream' }>

export function LiveStreamBlock({ block }: { block: LiveStreamData }) {
  const { title, embedUrl, description } = block

  return (
    <section style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>{title}</h2>
      <div
        style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}
      >
        <iframe
          src={embedUrl}
          title={title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          allowFullScreen
        />
      </div>
      {description && <p style={{ marginTop: '1rem', color: '#555' }}>{description}</p>}
    </section>
  )
}
