import React from 'react'
import type { Locale } from '@/config/locales'
import { Header } from '@/Header/Component'
import { Footer } from '@/Footer/Component'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <>
      <Header locale={locale as Locale} />
      <main className="flex-grow">{children}</main>
      <Footer locale={locale as Locale} />
    </>
  )
}
