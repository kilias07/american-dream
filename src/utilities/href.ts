import { type Locale } from '@/config/locales'

/** Język serwowany bez prefiksu w adresie (patrz audyt SEO). */
const defaultUnprefixedLocale: Locale = 'pl'

/**
 * Buduje wewnętrzny href dla danego locale wg schematu audytu:
 * - PL = domyślny, bez prefiksu (`/`, `/news/foo`)
 * - każdy inny język = pod własnym prefiksem (`/en`, `/de/news/foo`)
 *
 * Prefiks bierze się z KODU języka, a nie z twardego `/en`. Wcześniej każdy
 * język inny niż polski dostawał `/en`, więc po dodaniu niemieckiego wszystkie
 * linki na stronie niemieckiej prowadziłyby na wersję angielską.
 *
 * @param locale kod języka, np. 'pl' | 'en' | 'de'
 * @param path   ścieżka locale-agnostyczna z wiodącym slashem, np. '/news/foo' albo '/'
 */
export function localeHref(locale: Locale, path: string): string {
  const clean = path === '/' ? '' : path
  if (locale === defaultUnprefixedLocale) return clean || '/'
  return `/${locale}${clean}`
}
