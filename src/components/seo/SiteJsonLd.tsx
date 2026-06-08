import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import configPromise from '@payload-config'
import type { SiteSetting } from '@/payload-types'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://americandreamclub.pl'
const SITE_NAME = 'American Dream Club'

// Tagline shown on the live WordPress site's WebSite schema — kept verbatim so the
// Google "knowledge"/sitelinks treatment stays consistent with the old site.
const TAGLINE: Record<string, string> = {
  pl: 'Zapraszamy po relaks, dobry nastrój i pozytywne wibracje!',
  en: 'Come for relaxation, good mood and positive vibes!',
}

async function getSocials(): Promise<string[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const settings = (await payload.findGlobal({
      slug: 'site-settings',
      depth: 0,
    })) as SiteSetting
    return (settings?.social ?? [])
      .map((s) => s.url)
      .filter((url): url is string => Boolean(url))
  } catch {
    return []
  }
}

/**
 * Emits the WebSite + Organization JSON-LD graph (the same pair the previous
 * WordPress/Yoast site exposed). This is what feeds Google's site name,
 * logo and social profile links. The venue-specific NightClub/Restaurant
 * entity is emitted separately by <RestaurantJsonLd />.
 */
export async function SiteJsonLd({ locale }: { locale: string }) {
  const cachedSocials = unstable_cache(getSocials, ['seo-site-jsonld-socials'], {
    tags: ['global_site_settings'],
  })
  const socials = await cachedSocials()
  const inLanguage = locale === 'en' ? 'en' : 'pl-PL'

  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      description: TAGLINE[locale] ?? TAGLINE.pl,
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage,
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: {
        '@type': 'ImageObject',
        '@id': `${SITE_URL}/#logo`,
        url: `${SITE_URL}/images/logo-black.png`,
        contentUrl: `${SITE_URL}/images/logo-black.png`,
        caption: SITE_NAME,
      },
      image: { '@id': `${SITE_URL}/#logo` },
      ...(socials.length ? { sameAs: socials } : {}),
    },
  ]

  const jsonLd = { '@context': 'https://schema.org', '@graph': graph }

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inject; no user-controlled HTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
