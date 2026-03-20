import React from 'react'
import type { Page } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { RichTextRenderer } from '../RichTextRenderer'

type ContentData = Extract<NonNullable<Page['layout']>[number], { blockType: 'content' }>
type Column = NonNullable<ContentData['columns']>[number]

const sizeMap: Record<NonNullable<Column['size']>, string> = {
  oneThird: '33.333%',
  half: '50%',
  twoThirds: '66.666%',
  full: '100%',
}

export function ContentBlock({ block, locale }: { block: ContentData; locale?: string }) {
  const { columns } = block

  if (!columns || columns.length === 0) return null

  return (
    <section style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {columns.map((col, i) => {
          const width = col.size ? sizeMap[col.size] : '100%'
          return (
            <div key={col.id ?? i} style={{ flex: `0 0 ${width}`, maxWidth: width }}>
              <RichTextRenderer content={col.richText} />
              {col.enableLink && col.link?.label && (
                <CMSLink
                  type={col.link.type}
                  url={col.link.url}
                  reference={col.link.reference as any}
                  newTab={col.link.newTab}
                  label={col.link.label}
                  locale={locale}
                />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
