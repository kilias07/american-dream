import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { locales } from '@/config/locales'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://americandreamclub.pl'

// Known top-level page slugs (these mirror the CMS `pages` slugs + dedicated routes).
const STATIC_SLUGS = [
  'restauracja',
  'bar',
  'cigar-room',
  'program',
  'twoje-wydarzenie',
  'rezerwacje',
  'kontakt',
  'kontakt-dla-artystow',
  'aktualnosci',
] as const

/**
 * Build the `alternates.languages` map for a given path suffix (without the
 * leading locale segment). Each locale points at its own localized URL.
 */
function languageAlternates(pathAfterLocale: string): Record<string, string> {
  const suffix = pathAfterLocale ? `/${pathAfterLocale}` : ''
  return Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}${suffix}`]))
}

function entry(pathAfterLocale: string, lastModified?: Date): MetadataRoute.Sitemap {
  const suffix = pathAfterLocale ? `/${pathAfterLocale}` : ''
  return locales.map((locale) => ({
    url: `${SITE_URL}/${locale}${suffix}`,
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
        select: { updatedAt: true },
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
        entry(`aktualnosci/${p.slug}`, p.updatedAt ? new Date(p.updatedAt) : undefined),
      )

    const eventEntries = events.docs.flatMap((ev) =>
      entry(`program/${ev.id}`, ev.updatedAt ? new Date(ev.updatedAt) : undefined),
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
