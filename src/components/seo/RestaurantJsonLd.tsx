import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import configPromise from '@payload-config'
import type { OpeningHour, SiteSetting } from '@/payload-types'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://americandreamclub.pl'

// Map Payload day slugs -> schema.org DayOfWeek prefixes (Mo, Tu, ...).
const DAY_ABBR: Record<string, string> = {
  monday: 'Mo',
  tuesday: 'Tu',
  wednesday: 'We',
  thursday: 'Th',
  friday: 'Fr',
  saturday: 'Sa',
  sunday: 'Su',
}

async function getSeoGlobals(): Promise<{
  settings: SiteSetting | null
  hours: OpeningHour | null
}> {
  try {
    const payload = await getPayload({ config: configPromise })
    const [settings, hours] = await Promise.all([
      payload.findGlobal({ slug: 'site-settings', depth: 0 }) as Promise<SiteSetting>,
      payload.findGlobal({ slug: 'opening-hours', depth: 0 }) as Promise<OpeningHour>,
    ])
    return { settings: settings ?? null, hours: hours ?? null }
  } catch {
    return { settings: null, hours: null }
  }
}

function buildOpeningHours(hours: OpeningHour | null): string[] {
  const days = hours?.days ?? []
  return days
    .filter((d) => d.day && !d.closed && d.openTime && d.closeTime)
    .map((d) => `${DAY_ABBR[d.day as string] ?? ''} ${d.openTime}-${d.closeTime}`.trim())
    .filter(Boolean)
}

export async function RestaurantJsonLd() {
  const cachedGlobals = unstable_cache(getSeoGlobals, ['seo-restaurant-jsonld'], {
    tags: ['global_site_settings', 'global_opening_hours'],
  })
  const { settings, hours } = await cachedGlobals()

  const socials = (settings?.social ?? [])
    .map((s) => s.url)
    .filter((url): url is string => Boolean(url))

  const openingHours = buildOpeningHours(hours)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['NightClub', 'Restaurant'],
    name: settings?.siteName || 'American Dream Club',
    url: SITE_URL,
    image: `${SITE_URL}/website-template-OG.webp`,
    telephone: '+48 500 210 333',
    priceRange: '$$$',
    servesCuisine: ['European', 'Polish', 'Cocktails'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ul. Dominikańska 9',
      postalCode: '61-456',
      addressLocality: 'Poznań',
      addressCountry: 'PL',
    },
    ...(openingHours.length ? { openingHours } : {}),
    ...(socials.length ? { sameAs: socials } : {}),
  }

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inject; no user-controlled HTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
