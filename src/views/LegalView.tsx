import { type Locale } from '@/config/locales'
import { LegalDocument } from '@/components/LegalDocument'
import { localizedAlternates } from '@/utilities/seo'

type LegalField = Parameters<typeof LegalDocument>[0]['field']

export function renderLegal(field: LegalField, title: string, locale: Locale) {
  return <LegalDocument field={field} title={title} locale={locale} />
}

export function legalMetadata(title: string, pathAfterLocale: string, locale: Locale) {
  return {
    title,
    alternates: localizedAlternates(locale, pathAfterLocale),
  }
}
