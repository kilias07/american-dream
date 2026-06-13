'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { Locale } from '@/config/locales'

/**
 * Map the CURRENT path to its counterpart in the other locale.
 * PL is unprefixed (default); EN lives under `/en`.
 *   toLocalePath('/news', 'en') -> '/en/news'
 *   toLocalePath('/en/events/jazz-night', 'pl') -> '/events/jazz-night'
 */
export function toLocalePath(pathname: string, target: Locale): string {
  const bare = pathname.replace(/^\/en(?=\/|$)/, '') || '/'
  return target === 'en' ? (bare === '/' ? '/en' : `/en${bare}`) : bare
}

/**
 * PL | EN switcher used in the header (desktop + mobile). Maps the current path
 * to the same page in the other locale, persists the choice in NEXT_LOCALE, and
 * client-navigates there.
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
      <button
        type="button"
        onClick={() => go('pl')}
        className={linkClass(currentLocale === 'pl')}
        aria-current={currentLocale === 'pl' ? 'true' : undefined}
      >
        PL
      </button>
      <span className={separatorClassName ?? 'text-white/40 mx-0.5'}>|</span>
      <button
        type="button"
        onClick={() => go('en')}
        className={linkClass(currentLocale === 'en')}
        aria-current={currentLocale === 'en' ? 'true' : undefined}
      >
        EN
      </button>
    </div>
  )
}
