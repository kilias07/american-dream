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
  'rezerwacje',
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
// Render at request time against the live worker's D1 binding. Prerendering at
// build time yields an empty dynamic section (build-time D1 has no rows for the
// projected query), so the event/news/series URLs would be missing.
export const dynamic = 'force-dynamic'

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

  let payload
  try {
    payload = await getPayload({ config: configPromise })
  } catch {
    // DB unavailable (e.g. at build time with ephemeral D1) — serve static routes only.
    return staticEntries
  }

  // Query each collection independently so a single failing read (e.g. a row
  // with legacy/drifted data) only drops that collection's entries instead of
  // collapsing the whole dynamic section to the static fallback.
  type Doc = { slug?: string | null; updatedAt?: string | null }
  const safeFind = async (
    collection: 'posts' | 'events' | 'recurring-series',
    where?: Record<string, unknown>,
  ): Promise<Doc[]> => {
    try {
      const res = await payload.find({
        collection,
        ...(where ? { where } : {}),
        pagination: false,
        depth: 0,
        select: { slug: true, updatedAt: true },
      })
      return res.docs as Doc[]
    } catch {
      return []
    }
  }

  const [posts, events, series] = await Promise.all([
    safeFind('posts', { _status: { equals: 'published' } }),
    safeFind('events'),
    safeFind('recurring-series'),
  ])

  const toEntries = (docs: Doc[], prefix: string): MetadataRoute.Sitemap =>
    docs
      .filter((d) => d.slug)
      .flatMap((d) => entry(`${prefix}/${d.slug}`, d.updatedAt ? new Date(d.updatedAt) : undefined))

  return [
    ...staticEntries,
    ...toEntries(posts, 'news'),
    ...toEntries(events, 'events'),
    ...toEntries(series, 'wydarzenia-cykliczne'),
  ]
}
