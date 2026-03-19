'use client'

import { usePathname, useRouter } from 'next/navigation'

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
      <button
        onClick={() => switchLocale('en')}
        style={{ fontWeight: currentLocale === 'en' ? 'bold' : 'normal', cursor: 'pointer' }}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('pl')}
        style={{ fontWeight: currentLocale === 'pl' ? 'bold' : 'normal', cursor: 'pointer' }}
      >
        PL
      </button>
    </div>
  )
}
