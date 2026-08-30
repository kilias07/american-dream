import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type { Page, Post } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'

export type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  locale?: string
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts'
    value: Page | Post | string | number
  } | null
  size?: ButtonProps['size'] | null
  type?: 'custom' | 'reference' | null
  url?: string | null
}

/**
 * The destination of a CMS link — a reference to a document or a typed URL.
 * Split out of the component so anything that needs the address without
 * rendering an anchor (the header dropdown, for one) resolves it the same way
 * instead of reimplementing the slug and locale rules.
 */
export function cmsLinkHref({
  type,
  locale,
  reference,
  url,
}: Pick<CMSLinkType, 'type' | 'locale' | 'reference' | 'url'>): string | undefined {
  // `locale` flows in as a plain string from CMS configs; narrow to Locale for
  // the href helper. Falls back to building an unprefixed path when absent.
  const loc = (locale as Locale) ?? undefined

  if (type === 'reference' && typeof reference?.value === 'object' && reference.value.slug) {
    const slug = reference.value.slug as string
    if (reference.relationTo === 'posts') {
      return loc ? localeHref(loc, `/news/${slug}`) : `/news/${slug}`
    }
    // Home slug maps to '/', everything else to '/<slug>'.
    const path = slug === 'home' ? '/' : `/${slug}`
    return loc ? localeHref(loc, path) : path
  }

  if (url) {
    // Prefix internal (relative) URLs with the locale so navigation never
    // goes through a 307 redirect. External URLs (http/https) are left as-is.
    return loc && url.startsWith('/') ? localeHref(loc, url) : url
  }

  return undefined
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    locale,
    newTab,
    reference,
    size: sizeFromProps,
    url,
  } = props

  const href = cmsLinkHref({ type, locale, reference, url })

  if (!href) return null

  const size = appearance === 'link' ? 'clear' : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  if (appearance === 'inline') {
    return (
      <Link className={cn(className)} href={href} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link href={href} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    </Button>
  )
}
