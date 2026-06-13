import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React from 'react'

import type { Page, Post } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'
import { ReserveTrigger } from '@/components/reservations/MyRest'
import { isReservationUrl } from '@/lib/reservation-url'

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

  // `locale` flows in as a plain string from CMS configs; narrow to Locale for
  // the href helper. Falls back to building an unprefixed path when absent.
  const loc = (locale as Locale) ?? undefined

  if (type === 'reference' && typeof reference?.value === 'object' && reference.value.slug) {
    const slug = reference.value.slug as string
    if (reference.relationTo === 'posts') {
      href = loc ? localeHref(loc, `/news/${slug}`) : `/news/${slug}`
    } else {
      // Home slug maps to '/', everything else to '/<slug>'.
      const path = slug === 'home' ? '/' : `/${slug}`
      href = loc ? localeHref(loc, path) : path === '/' ? '/' : path
    }
  } else if (url) {
    // Prefix internal (relative) URLs with the locale so navigation never
    // goes through a 307 redirect. External URLs (http/https) are left as-is.
    if (loc && url.startsWith('/')) {
      href = localeHref(loc, url)
    } else {
      href = url
    }
  }

  if (!href) return null

  // Any CMS link pointing at the reservations page opens the MyRest booking
  // widget instead of navigating — keeps every "Rezerwacje"/"Zarezerwuj" CTA on
  // the same booking flow no matter where it's configured.
  if (isReservationUrl(href)) {
    return (
      <ReserveTrigger className={cn(className)}>
        {label && label}
        {children && children}
      </ReserveTrigger>
    )
  }

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
