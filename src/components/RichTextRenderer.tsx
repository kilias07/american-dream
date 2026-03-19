import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

// Shape matches Payload's serialized Lexical editor state
type SerializedEditorState = {
  root: {
    type: string
    children: { type: string; version: number; [k: string]: unknown }[]
    direction: 'ltr' | 'rtl' | null
    format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''
    indent: number
    version: number
  }
  [k: string]: unknown
}

export function RichTextRenderer({ content }: { content: SerializedEditorState | null | undefined }) {
  if (!content) return null
  return <RichText data={content} />
}
