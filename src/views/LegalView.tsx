import { type Locale } from '@/config/locales'
import { LegalDocument } from '@/components/LegalDocument'
import { brandTitle, buildMetadata } from '@/lib/audit-seo'

type LegalField = Parameters<typeof LegalDocument>[0]['field']

export function renderLegal(field: LegalField, title: string, locale: Locale) {
  return <LegalDocument field={field} title={title} locale={locale} />
}

/**
 * Weryfikacja audytu 2026-08-06, punkt 6: strony prawne wypadały poza szablon
 * „pozostałe podstrony" — title szedł przez globalny template z separatorem
 * `|`, bez Title Case, a description w ogóle nie było (na PL zaciągał się
 * angielski opis z root layoutu). Teraz każda ma własny opis w swoim języku,
 * a `buildMetadata` narzuca format „… - American Dream Club" + canonical.
 */
const DESCRIPTIONS: Record<string, Record<Locale, string>> = {
  regulamin: {
    pl: 'Regulamin American Dream Club w Poznaniu — zasady wstępu dla osób powyżej 21. roku życia, rezerwacji stolików, płatności oraz zachowania na terenie klubu i restauracji.',
    en: 'The American Dream Club rules in Poznań — entry conditions for guests over 21, table booking, payments and conduct within the club and restaurant.',
  },
  privacy: {
    pl: 'Polityka prywatności American Dream Club — jakie dane zbieramy przy rezerwacji i kontakcie, w jakim celu je przetwarzamy, jak długo je przechowujemy i jakie masz prawa.',
    en: 'The American Dream Club privacy policy — what data we collect when you book or contact us, why we process it, how long we keep it and what rights you have.',
  },
  'dane-firmy': {
    pl: 'Dane firmy American Dream Club w Poznaniu — pełna nazwa, adres siedziby przy Dominikańskiej 9, numery NIP i REGON oraz dane kontaktowe do spraw formalnych.',
    en: 'Company details for American Dream Club in Poznań — full legal name, registered address at Dominikańska 9, tax numbers and contact details for formal matters.',
  },
}

export function legalMetadata(title: string, pathAfterLocale: string, locale: Locale) {
  return buildMetadata({
    locale,
    path: pathAfterLocale,
    title: brandTitle(title),
    description: DESCRIPTIONS[pathAfterLocale]?.[locale],
  })
}
