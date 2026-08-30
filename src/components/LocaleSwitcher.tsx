'use client'

import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '@/config/locales'

/** Język serwowany bez prefiksu (patrz `localeHref`). */
const UNPREFIXED: Locale = 'pl'

/** Prefiksy wszystkich języków poza domyślnym, np. /en, /de, /fr, /es. */
const PREFIXED = locales.filter((l) => l !== UNPREFIXED)
const STRIP_PREFIX = new RegExp(`^/(${PREFIXED.join('|')})(?=/|$)`)

/**
 * Zamienia BIEŻĄCĄ ścieżkę na jej odpowiednik w innym języku.
 * Polski jest bez prefiksu, pozostałe języki mają własny (`/en`, `/de`…).
 *   toLocalePath('/news', 'en') -> '/en/news'
 *   toLocalePath('/de/events/jazz', 'pl') -> '/events/jazz'
 *
 * Prefiksy wyliczamy z konfiguracji języków — wcześniej były wpisane na sztywno
 * jako `/en`, więc po dodaniu kolejnego języka przełącznik gubił ścieżkę.
 */
export function toLocalePath(pathname: string, target: Locale): string {
  const bare = pathname.replace(STRIP_PREFIX, '') || '/'
  if (target === UNPREFIXED) return bare
  return bare === '/' ? `/${target}` : `/${target}${bare}`
}

/**
 * Przełącznik języka w nagłówku (desktop + mobile). Renderuje WSZYSTKIE języki
 * z konfiguracji, więc dodanie kolejnego nie wymaga ruszania tego komponentu.
 */
export function LocaleSwitcher({
  currentLocale,
  className,
  linkClassName,
  separatorClassName,
  onNavigate,
}: {
  currentLocale: Locale
  className?: string
  linkClassName?: (active: boolean) => string
  separatorClassName?: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  const go = (target: Locale) => {
    if (target !== currentLocale) {
      document.cookie = `NEXT_LOCALE=${target};path=/;max-age=31536000`
      router.push(toLocalePath(pathname, target))
    }
    onNavigate?.()
  }

  const defaultLink = (active: boolean) =>
    active ? 'text-brand-gold' : 'text-white hover:text-brand-gold transition-colors'
  const linkClass = linkClassName ?? defaultLink

  return (
    <div className={className ?? 'flex items-center gap-1 text-[12px] font-bold tracking-wider'}>
      {locales.map((code, i) => (
        <span key={code} className="contents">
          {i > 0 && <span className={separatorClassName ?? 'text-white/40 mx-0.5'}>|</span>}
          <button
            type="button"
            onClick={() => go(code)}
            className={linkClass(currentLocale === code)}
            aria-current={currentLocale === code ? 'true' : undefined}
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  )
}
