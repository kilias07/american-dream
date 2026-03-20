import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'

import type { Footer } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { CMSLink } from '@/components/Link'

async function getFooter(locale: Locale): Promise<Footer | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    return payload.findGlobal({ slug: 'footer', locale, depth: 1 })
  } catch {
    return null
  }
}

export async function Footer({ locale }: { locale: Locale }) {
  const cachedFooter = unstable_cache(
    () => getFooter(locale),
    [`footer-${locale}`],
    { tags: ['global_footer'] },
  )
  const footer = await cachedFooter()
  const navItems = footer?.navItems || []

  return (
    <footer className="mt-auto border-t border-border bg-black dark:bg-card text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link className="flex items-center font-bold text-xl" href={`/${locale}`}>
          American Dream
        </Link>

        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          <nav className="flex flex-col md:flex-row gap-4">
            {navItems.map(({ link }, i) => (
              <CMSLink className="text-white" key={i} {...link} locale={locale} />
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
