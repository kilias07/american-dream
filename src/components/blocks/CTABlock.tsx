import React from 'react'
import type { Page } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { RichTextRenderer } from '../RichTextRenderer'

type CTAData = Extract<NonNullable<Page['layout']>[number], { blockType: 'cta' }>

export function CTABlock({ block, locale }: { block: CTAData; locale?: string }) {
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
              <CMSLink
                key={item.id ?? i}
                type={item.link.type}
                url={item.link.url}
                reference={item.link.reference as any}
                newTab={item.link.newTab}
                label={item.link.label}
                locale={locale}
                appearance={item.link.appearance ?? 'default'}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
