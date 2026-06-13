import { type Locale } from '@/config/locales'

/**
 * Buduje wewnętrzny href dla danego locale wg schematu audytu:
 * - PL = domyślny, bez prefiksu (`/`, `/news/foo`)
 * - EN = pod prefiksem `/en` (`/en`, `/en/news/foo`)
 *
 * @param locale 'pl' | 'en'
 * @param path   ścieżka locale-agnostyczna z wiodącym slashem, np. '/news/foo' albo '/'
 */
export function localeHref(locale: Locale, path: string): string {
  const clean = path === '/' ? '' : path
  return locale === 'pl' ? clean || '/' : `/en${clean}`
}
