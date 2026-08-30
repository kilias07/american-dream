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
    de: 'Hausordnung des American Dream Club in Posen — Einlassregeln für Personen ab 21 Jahren, Tischreservierung, Zahlungen sowie Verhalten im Club und Restaurant.',
    fr: 'Règlement de l’American Dream Club à Poznań — conditions d’accès pour les personnes de plus de 21 ans, réservation de table, paiements et règles de conduite dans le club et le restaurant.',
    es: 'Normas del American Dream Club de Poznań: condiciones de acceso para mayores de 21 años, reserva de mesa, pagos y comportamiento en el club y el restaurante.',
  },
  privacy: {
    pl: 'Polityka prywatności American Dream Club — jakie dane zbieramy przy rezerwacji i kontakcie, w jakim celu je przetwarzamy, jak długo je przechowujemy i jakie masz prawa.',
    en: 'The American Dream Club privacy policy — what data we collect when you book or contact us, why we process it, how long we keep it and what rights you have.',
    de: 'Datenschutzerklärung des American Dream Club — welche Daten wir bei Reservierung und Kontakt erheben, zu welchem Zweck wir sie verarbeiten, wie lange wir sie speichern und welche Rechte Sie haben.',
    fr: 'Politique de confidentialité de l’American Dream Club — quelles données nous collectons lors des réservations et des contacts, à quelles fins, combien de temps nous les conservons et quels sont vos droits.',
    es: 'Política de privacidad del American Dream Club: qué datos recogemos al reservar y contactar, con qué fin los tratamos, cuánto tiempo los conservamos y cuáles son tus derechos.',
  },
  'dane-firmy': {
    pl: 'Dane firmy American Dream Club w Poznaniu — pełna nazwa, adres siedziby przy Dominikańskiej 9, numery NIP i REGON oraz dane kontaktowe do spraw formalnych.',
    en: 'Company details for American Dream Club in Poznań — full legal name, registered address at Dominikańska 9, tax numbers and contact details for formal matters.',
    de: 'Firmendaten des American Dream Club in Posen — vollständiger Name, Sitz in der Dominikańska 9, Steuernummern NIP und REGON sowie Kontaktdaten für formale Angelegenheiten.',
    fr: 'Informations légales de l’American Dream Club à Poznań — dénomination complète, siège au 9 rue Dominikańska, numéros NIP et REGON ainsi que les coordonnées pour les questions administratives.',
    es: 'Datos de la empresa American Dream Club en Poznań: denominación completa, sede en Dominikańska 9, números NIP y REGON y datos de contacto para asuntos formales.',
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
