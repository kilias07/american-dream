import React from 'react'
import type { Page } from '@/payload-types'
import { RichTextRenderer } from '../RichTextRenderer'

type RichTextData = Extract<NonNullable<Page['layout']>[number], { blockType: 'richText' }>

export function RichTextBlock({ block }: { block: RichTextData }) {
  return (
    <section style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 2rem' }}>
      <RichTextRenderer content={block.content} />
    </section>
  )
}
