import React from 'react'
import type { Locale } from '@/config/locales'
import { Header } from '@/Header/Component'
import { Footer } from '@/Footer/Component'
import { MyRestWidget } from '@/components/reservations/MyRest'

/**
 * Wspólna powłoka strony dla obu drzew tras (PL bezprefiksowe + EN pod `/en`).
 * To dawne ciało `[locale]/layout.tsx` minus walidacja locale — segment locale
 * jest teraz określany przez samo drzewo tras, więc nie ma nieznanych locale.
 */
export function Shell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <>
      <Header locale={locale} />
      <main className="flex-grow">{children}</main>
      <Footer locale={locale} />
      {/* Old-site reservation flow: MyRest self-injects a floating
          "Zarezerwuj stolik" button + booking modal on every page. */}
      <MyRestWidget />
    </>
  )
}
