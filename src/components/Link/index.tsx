import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type { Page, Post } from '@/payload-types'

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

  let href: string | undefined

  if (type === 'reference' && typeof reference?.value === 'object' && reference.value.slug) {
    const slug = reference.value.slug as string
    if (reference.relationTo === 'posts') {
      href = locale ? `/${locale}/posts/${slug}` : `/posts/${slug}`
    } else {
      href = locale ? `/${locale}/${slug === 'home' ? '' : slug}` : `/${slug === 'home' ? '' : slug}`
    }
  } else if (url) {
    href = url
  }

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
