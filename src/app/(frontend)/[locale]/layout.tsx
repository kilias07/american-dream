import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Header, Footer } from '@/payload-types'

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'pl' }]
}

async function getHeader(locale: string): Promise<Header | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    return payload.findGlobal({ slug: 'header', locale: locale as 'en' | 'pl' })
  } catch {
    return null
  }
}

async function getFooter(locale: string): Promise<Footer | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    return payload.findGlobal({ slug: 'footer', locale: locale as 'en' | 'pl' })
  } catch {
    return null
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  const cachedHeader = unstable_cache(() => getHeader(locale), [`header-${locale}`], {
    tags: ['global-header'],
  })
  const cachedFooter = unstable_cache(() => getFooter(locale), [`footer-${locale}`], {
    tags: ['global-footer'],
  })

  const [header, footer] = await Promise.all([cachedHeader(), cachedFooter()])

  return (
    <html lang={locale}>
      <body>
        <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
          <nav>
            {header?.navItems?.map((item, i) => (
              <a
                key={item.id ?? i}
                href={item.link.url ?? '#'}
                style={{ marginRight: '1rem' }}
                target={item.link.newTab ? '_blank' : undefined}
                rel={item.link.newTab ? 'noopener noreferrer' : undefined}
              >
                {item.link.label}
              </a>
            ))}
          </nav>
        </header>
        <main>{children}</main>
        <footer style={{ padding: '1rem', borderTop: '1px solid #eee', marginTop: '2rem' }}>
          {footer?.copyright && <p>{footer.copyright}</p>}
        </footer>
      </body>
    </html>
  )
}
