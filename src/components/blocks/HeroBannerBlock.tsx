import React from 'react'
import type { Media, Page } from '@/payload-types'

type HeroBannerData = Extract<NonNullable<Page['layout']>[number], { blockType: 'heroBanner' }>

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

export function HeroBannerBlock({ block }: { block: HeroBannerData }) {
  const { heading, subtext, backgroundImage, link } = block
  const image = isMedia(backgroundImage) ? backgroundImage : null

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem 2rem',
        backgroundImage: image?.url ? `url(${image.url})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: image?.url ? undefined : '#1a1a2e',
        color: '#fff',
      }}
    >
      <div style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{heading}</h1>
        {subtext && <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>{subtext}</p>}
        {link.label && (
          <a
            href={link.url ?? '#'}
            target={link.newTab ? '_blank' : undefined}
            rel={link.newTab ? 'noopener noreferrer' : undefined}
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              border: link.appearance === 'outline' ? '2px solid #fff' : 'none',
              backgroundColor: link.appearance === 'outline' ? 'transparent' : '#e63946',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            {link.label}
          </a>
        )}
      </div>
    </section>
  )
}
