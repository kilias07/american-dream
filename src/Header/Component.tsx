import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'

import type { Header } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { CMSLink } from '@/components/Link'

async function getHeader(locale: Locale): Promise<Header | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    return payload.findGlobal({ slug: 'header', locale, depth: 1 })
  } catch {
    return null
  }
}

export async function Header({ locale }: { locale: Locale }) {
  const cachedHeader = unstable_cache(
    () => getHeader(locale),
    [`header-${locale}`],
    { tags: ['global_header'] },
  )
  const header = await cachedHeader()
  const navItems = header?.navItems || []

  return (
    <header className="container relative z-20">
      <div className="py-8 flex justify-between items-center">
        <Link href={`/${locale}`} className="font-bold text-xl">
          American Dream
        </Link>
        <nav className="flex gap-3 items-center">
          {navItems.map(({ link }, i) => (
            <CMSLink key={i} {...link} locale={locale} appearance="link" />
          ))}
        </nav>
      </div>
    </header>
  )
}
