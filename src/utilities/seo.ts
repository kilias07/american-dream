import type { Metadata } from 'next'
import { locales } from '@/config/locales'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://americandreamclub.pl'

/**
 * Build `alternates` (canonical + hreflang languages) for a localized route.
 *
 * @param locale            the current locale segment (e.g. 'pl' | 'en')
 * @param pathAfterLocale   path after the locale segment, no leading slash
 *                          (e.g. '' for home, 'program/123', 'aktualnosci/foo')
 */
export function localizedAlternates(
  locale: string,
  pathAfterLocale: string,
): NonNullable<Metadata['alternates']> {
  const suffix = pathAfterLocale ? `/${pathAfterLocale}` : ''
  return {
    canonical: `${SITE_URL}/${locale}${suffix}`,
    languages: Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${suffix}`])),
  }
}
