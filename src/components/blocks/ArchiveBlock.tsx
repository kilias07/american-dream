import React from 'react'
import type { Page } from '@/payload-types'
import { RichTextRenderer } from '../RichTextRenderer'

type ArchiveData = Extract<NonNullable<Page['layout']>[number], { blockType: 'archive' }>

export function ArchiveBlock({ block }: { block: ArchiveData }) {
  const { introContent } = block

  return (
    <section style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {introContent && (
        <div style={{ marginBottom: '2rem' }}>
          <RichTextRenderer content={introContent} />
        </div>
      )}
      <p style={{ color: '#888', fontStyle: 'italic' }}>Archive content will be rendered here.</p>
    </section>
  )
}
