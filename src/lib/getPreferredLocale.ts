import { cookies, headers } from 'next/headers'
import { locales, defaultLocale, type Locale } from '@/config/locales'

/**
 * Server-side locale detection (replaces the former proxy/middleware).
 * Order: NEXT_LOCALE cookie -> Accept-Language header -> default locale.
 * Next 16 proxy runs on the Node runtime, which @opennextjs/cloudflare does not
 * yet support, so locale handling is done in-app instead of in middleware.
 */
export async function getPreferredLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale
  }

  const headerStore = await headers()
  const acceptLanguage = headerStore.get('accept-language')
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim().toLowerCase().slice(0, 2))
      .find((lang): lang is Locale => locales.includes(lang as Locale))
    if (preferred) return preferred
  }

  return defaultLocale
}
