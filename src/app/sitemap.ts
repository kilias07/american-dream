import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { locales } from '@/config/locales'
import { localeUrl } from '@/utilities/seo'

// Known top-level page slugs (these mirror the CMS `pages` slugs + dedicated routes).
// SEO audit: English URL slugs + new /events and /business listings.
const STATIC_SLUGS = [
  'restaurant',
  'bar-and-cocktails',
  'cigar-lounge',
  'events',
  'business',
  // /business/[slug] detail pages (audit: per-type offer pages)
  'business/christmas',
  'business/meetings',
  'business/birthday',
  'business/stag',
  'business/venue-hire',
  'news',
  'news/pod-papugami',
  'rezerwacja',
  'contact',
  'kontakt-dla-artystow',
  'privacy',
  'regulamin',
  'dane-firmy',
] as const

/**
 * Build the `alternates.languages` map for a given path suffix (without the
 * leading locale segment). PL is unprefixed (default), EN lives under `/en`.
 */
function languageAlternates(pathAfterLocale: string): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localeUrl(locale, pathAfterLocale)])),
    // x-default points at the canonical PL (unprefixed) URL.
    'x-default': localeUrl('pl', pathAfterLocale),
  }
}

function entry(pathAfterLocale: string, lastModified?: Date): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: localeUrl(locale, pathAfterLocale),
    lastModified: lastModified ?? new Date(),
    changeFrequency: 'weekly' as const,
    priority: pathAfterLocale === '' ? 1 : 0.8,
    alternates: { languages: languageAlternates(pathAfterLocale) },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes: home (`/{locale}`) + known page slugs, for every locale.
  const staticEntries: MetadataRoute.Sitemap = [
    ...entry(''),
    ...STATIC_SLUGS.flatMap((slug) => entry(slug)),
  ]

  try {
    const payload = await getPayload({ config: configPromise })

    const [posts, events, series] = await Promise.all([
      payload.find({
        collection: 'posts',
        where: { _status: { equals: 'published' } },
        pagination: false,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
      payload.find({
        collection: 'events',
        pagination: false,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
      payload.find({
        collection: 'recurring-series',
        pagination: false,
        depth: 0,
        select: { slug: true, updatedAt: true },
      }),
    ])

    const postEntries = posts.docs
      .filter((p) => p.slug)
      .flatMap((p) =>
        entry(`news/${p.slug}`, p.updatedAt ? new Date(p.updatedAt) : undefined),
      )

    const eventEntries = events.docs
      .filter((ev) => ev.slug)
      .flatMap((ev) =>
        entry(`events/${ev.slug}`, ev.updatedAt ? new Date(ev.updatedAt) : undefined),
      )

    const seriesEntries = series.docs
      .filter((s) => s.slug)
      .flatMap((s) =>
        entry(
          `wydarzenia-cykliczne/${s.slug}`,
          s.updatedAt ? new Date(s.updatedAt) : undefined,
        ),
      )

    return [...staticEntries, ...postEntries, ...eventEntries, ...seriesEntries]
  } catch {
    // DB unavailable (e.g. at build time with ephemeral D1) — serve static routes only.
    return staticEntries
  }
}
