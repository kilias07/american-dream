import React from 'react'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { SiteSetting } from '@/payload-types'
import { InitTheme } from '@/providers/Theme/InitTheme'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://americandreamclub.pl'
const SITE_NAME = 'American Dream Club'
const SITE_DESCRIPTION =
  'American Dream Club — restauracja i klub jazzowy w sercu Poznania. Koncerty na żywo, autorska kuchnia, bar i cigar room.'
// 1200×630 sRGB link-preview card (public/og-image.jpg). Used by Facebook,
// Messenger, WhatsApp, iMessage, LinkedIn, X, etc. when the link is shared.
const OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: SITE_NAME,
}
// Brand Facebook page — mirrors the old site's `article:publisher` tag.
const FACEBOOK_PAGE = 'https://www.facebook.com/americandreamclubpoznan'

// Site name + default description come from the `site-settings` global so they
// are CMS-editable; the constants above are the fallback if the global is empty
// or the DB is briefly unavailable (e.g. during build).
async function getSiteMeta(): Promise<{ name: string; description: string }> {
  const cached = unstable_cache(
    async () => {
      try {
        const payload = await getPayload({ config: configPromise })
        const s = (await payload.findGlobal({
          slug: 'site-settings',
          depth: 0,
        })) as SiteSetting | null
        return {
          name: s?.siteName?.trim() || SITE_NAME,
          description: s?.metaDescription?.trim() || SITE_DESCRIPTION,
        }
      } catch {
        return { name: SITE_NAME, description: SITE_DESCRIPTION }
      }
    },
    ['root-site-meta'],
    { tags: ['global_site_settings'] },
  )
  return cached()
}

export async function generateMetadata(): Promise<Metadata> {
  const { name, description } = await getSiteMeta()
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description,
    applicationName: name,
    // Same crawl directives Yoast emitted on the live site, so the Google
    // listing keeps large image previews and untruncated snippets.
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
    openGraph: {
      type: 'website',
      siteName: name,
      title: name,
      description,
      locale: 'pl_PL',
      alternateLocale: ['en_GB'],
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: [OG_IMAGE.url],
    },
    other: {
      'article:publisher': FACEBOOK_PAGE,
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // PL is the primary content language for this site, so the document defaults to
  // `lang="pl"`. Per-page `generateMetadata` exports add canonical + hreflang
  // alternates so EN pages are still discoverable/correctly associated by crawlers.
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Metropolis (body) is self-hosted — preload the primary weight to cut
            FOUT on first paint. Playfair Display (display headings) is loaded from
            Google Fonts. */}
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/fonts/metropolis/Metropolis-Regular.woff2"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
