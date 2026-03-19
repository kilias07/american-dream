import React from 'react'
import type { Page } from '@/payload-types'
import { RichTextRenderer } from '../RichTextRenderer'

type CTAData = Extract<NonNullable<Page['layout']>[number], { blockType: 'cta' }>

export function CTABlock({ block }: { block: CTAData }) {
  const { richText, links } = block

  return (
    <section
      style={{
        padding: '4rem 2rem',
        backgroundColor: '#f5f5f5',
        textAlign: 'center',
        margin: '2rem 0',
      }}
    >
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <RichTextRenderer content={richText} />
        {links && links.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginTop: '1.5rem',
            }}
          >
            {links.map((item, i) => (
              <a
                key={item.id ?? i}
                href={item.link.url ?? '#'}
                target={item.link.newTab ? '_blank' : undefined}
                rel={item.link.newTab ? 'noopener noreferrer' : undefined}
                style={{
                  padding: '0.75rem 2rem',
                  border:
                    item.link.appearance === 'outline' ? '2px solid #333' : 'none',
                  backgroundColor:
                    item.link.appearance === 'outline' ? 'transparent' : '#333',
                  color: item.link.appearance === 'outline' ? '#333' : '#fff',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                }}
              >
                {item.link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
