'use client'

import { usePathname, useRouter } from 'next/navigation'
import { locales } from '@/config/locales'

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPath = segments.join('/')
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`
    router.push(newPath)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          style={{ fontWeight: currentLocale === locale ? 'bold' : 'normal', cursor: 'pointer' }}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
