import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/config/locales'
import { LegalDocument } from '@/components/LegalDocument'
import { localizedAlternates } from '@/utilities/seo'

const TITLE: Record<Locale, string> = {
  pl: 'Dane firmy',
  en: 'Company details',
}

export default async function CompanyDataPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale as Locale)) notFound()
  return (
    <LegalDocument field="companyData" title={TITLE[locale as Locale]} locale={locale as Locale} />
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const title = TITLE[locale as Locale] ?? TITLE.en
  return {
    title,
    alternates: localizedAlternates(locale, 'dane-firmy'),
  }
}
