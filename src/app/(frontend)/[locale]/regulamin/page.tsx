import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/config/locales'
import { LegalDocument } from '@/components/LegalDocument'
import { localizedAlternates } from '@/utilities/seo'

const TITLE: Record<Locale, string> = {
  pl: 'Regulamin klubu',
  en: 'Club rules',
}

export default async function RegulaminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!locales.includes(locale as Locale)) notFound()
  return (
    <LegalDocument field="regulamin" title={TITLE[locale as Locale]} locale={locale as Locale} />
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const title = TITLE[locale as Locale] ?? TITLE.en
  return {
    title,
    alternates: localizedAlternates(locale, 'regulamin'),
  }
}
