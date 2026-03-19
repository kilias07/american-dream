import React from 'react'
import type { Page } from '@/payload-types'
import { RichTextRenderer } from '../RichTextRenderer'

type BannerData = Extract<NonNullable<Page['layout']>[number], { blockType: 'banner' }>

const styleMap: Record<BannerData['style'], { backgroundColor: string; borderColor: string; color: string }> = {
  info: { backgroundColor: '#e7f3fe', borderColor: '#2196f3', color: '#0c5460' },
  warning: { backgroundColor: '#fff3cd', borderColor: '#ffc107', color: '#856404' },
  error: { backgroundColor: '#f8d7da', borderColor: '#f44336', color: '#721c24' },
  success: { backgroundColor: '#d4edda', borderColor: '#4caf50', color: '#155724' },
}

export function BannerBlock({ block }: { block: BannerData }) {
  const colors = styleMap[block.style]

  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        margin: '1rem 2rem',
        borderLeft: `4px solid ${colors.borderColor}`,
        backgroundColor: colors.backgroundColor,
        color: colors.color,
        borderRadius: '4px',
      }}
    >
      <RichTextRenderer content={block.content} />
    </div>
  )
}
