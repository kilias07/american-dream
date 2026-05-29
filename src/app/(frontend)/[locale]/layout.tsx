import React from 'react'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/config/locales'
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

  // Only render for known locales; any other path segment (e.g. /wp-admin,
  // /favicon.ico, bot probes) 404s instead of rendering a wrong-locale page.
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  return (
    <>
      <Header locale={locale as Locale} />
      <main className="flex-grow">{children}</main>
      <Footer locale={locale as Locale} />
    </>
  )
}
