import type { Metadata } from 'next'
import { type Locale } from '@/config/locales'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://americandreamclub.pl'

/** Prefiks ścieżki dla locale: PL bez prefiksu (default), EN pod `/en`. */
export function localePrefix(locale: Locale): string {
  return locale === 'pl' ? '' : `/${locale}`
}

/**
 * Bezwzględny URL dla locale + ścieżki po locale (bez wiodącego slasha).
 * @example localeUrl('pl', '')            -> https://…/
 * @example localeUrl('pl', 'news/foo')    -> https://…/news/foo
 * @example localeUrl('en', 'news/foo')    -> https://…/en/news/foo
 */
export function localeUrl(locale: Locale, pathAfterLocale: string): string {
  const suffix = pathAfterLocale ? `/${pathAfterLocale}` : ''
  const url = `${SITE_URL}${localePrefix(locale)}${suffix}`
  // dla strony głównej PL canonical = goły origin (np. https://…/), bez trailing po origin
  return url || SITE_URL
}

/** Mapa hreflang (pl, en, x-default→pl) dla danej ścieżki po locale. */
function languageAlternates(pathAfterLocale: string): Record<string, string> {
  return {
    pl: localeUrl('pl', pathAfterLocale),
    en: localeUrl('en', pathAfterLocale),
    'x-default': localeUrl('pl', pathAfterLocale),
  }
}

/**
 * Buduje `alternates` (canonical + hreflang) dla zlokalizowanej trasy.
 * Canonical jest bez prefiksu dla PL, z `/en` dla EN.
 *
 * @param locale          bieżące locale ('pl' | 'en')
 * @param pathAfterLocale ścieżka po locale, bez wiodącego slasha
 *                        (np. '' dla home, 'events/foo', 'news/bar')
 */
export function localizedAlternates(
  locale: Locale,
  pathAfterLocale: string,
): NonNullable<Metadata['alternates']> {
  return {
    canonical: localeUrl(locale, pathAfterLocale),
    languages: languageAlternates(pathAfterLocale),
  }
}
