import React from 'react'
import { RichText, LinkJSXConverter, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { fixOrphansInRichText } from '@/utilities/typography'
import { defaultLocale, type Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'

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

// Shape of the `link` node's `doc` field once Payload has populated it.
type InternalDoc = {
  relationTo?: string
  value?: number | string | { slug?: string | null; url?: string | null }
}

/**
 * Where an *internal* rich-text link (linkType: 'internal') points to.
 * Without this the built-in converter has no way to turn a document reference
 * into a URL and falls back to `href="#"`, so every internal link in the CMS
 * looks active but goes nowhere.
 *
 * Three kinds of target, all picked from a list in the editor:
 * media (a PDF or other file → its own URL), posts (`/news/…`) and pages
 * (site root, with `home` collapsing to `/`).
 */
function internalDocToHref(locale: Locale, doc: InternalDoc | null | undefined): string {
  const value = doc?.value
  const populated = typeof value === 'object' && value !== null ? value : undefined

  // Files are served straight from R2 — no locale prefix, no slug rewriting.
  if (doc?.relationTo === 'media') return populated?.url || '#'

  const slug = populated?.slug
  if (!slug) return localeHref(locale, '/')

  const path =
    doc?.relationTo === 'posts' ? `/news/${slug}` : slug === 'home' ? '/' : `/${slug}`
  return localeHref(locale, path)
}

/**
 * Alignment and indentation are stored on the element node (`format` / `indent`)
 * but Payload's built-in paragraph and heading converters drop both, so a
 * centred paragraph in the CMS would render flush left on the site. These
 * wrappers put them back.
 */
function blockStyle(node: { format?: unknown; indent?: unknown }): React.CSSProperties | undefined {
  const align = typeof node.format === 'string' && node.format ? node.format : undefined
  const indent = typeof node.indent === 'number' && node.indent > 0 ? node.indent : undefined
  if (!align && !indent) return undefined
  return {
    ...(align ? { textAlign: align as React.CSSProperties['textAlign'] } : {}),
    ...(indent ? { paddingInlineStart: `${indent * 2}rem` } : {}),
  }
}

export function RichTextRenderer({
  content,
  locale = defaultLocale,
}: {
  content: SerializedEditorState | null | undefined
  /** Locale of the surrounding page — decides the prefix on internal links. */
  locale?: Locale | string
}) {
  if (!content) return null

  const loc = (locale === 'en' ? 'en' : 'pl') as Locale

  const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
    ...defaultConverters,
    ...LinkJSXConverter({
      internalDocToHref: ({ linkNode }) =>
        internalDocToHref(loc, linkNode.fields?.doc as InternalDoc | null | undefined),
    }),
    paragraph: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      if (!children?.length) return <p><br /></p>
      return <p style={blockStyle(node)}>{children}</p>
    },
    heading: ({ node, nodesToJSX }) => {
      const children = nodesToJSX({ nodes: node.children })
      const Tag = node.tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return <Tag style={blockStyle(node)}>{children}</Tag>
    },
  })

  // Niełamliwe spójniki (a/i/o/u/w/z) — sieroty na końcach linii (uwaga klienta 2026-08)
  return <RichText className="adc-richtext" converters={converters} data={fixOrphansInRichText(content)} />
}
