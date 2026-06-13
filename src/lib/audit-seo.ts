import type { Metadata } from 'next'
import type { Locale } from '@/config/locales'
import { toTitleCase } from '@/utilities/titleCase'
import { localizedAlternates } from '@/utilities/seo'

/**
 * Centralne, statyczne metadane SEO z audytu (title / description / h1 / keywords).
 * PL = wartości 1:1 z audytu; EN = ekwiwalenty (audyt podaje tylko PL).
 *
 * Zasady audytu:
 * - title / description / h1: Title Case (każde słowo od wielkiej litery) — wymuszane
 *   przez `toTitleCase`, więc obowiązuje też dla nadpisań z CMS i pól dynamicznych.
 * - title w formacie „… - American Dream Club" (separator " - ", absolute).
 * - keywords: BEZ Title Case (frazy pod wyszukiwarkę, małymi literami).
 * - docelowo wartości będą nadpisywane dynamicznie (GSC) / z `page.meta` w CMS.
 */

export const BRAND = 'American Dream Club'

export type AuditEntry = {
  title: string
  description: string
  h1: string
  keywords?: string[]
}

type Key =
  | 'home'
  | 'restaurant'
  | 'bar-and-cocktails'
  | 'cigar-lounge'
  | 'events'
  | 'business'
  | 'news'
  | 'pod-papugami'

export const AUDIT_SEO: Record<Key, Record<Locale, AuditEntry>> = {
  home: {
    pl: {
      title: 'Jazz Club & Restauracja Z Muzyką Na Żywo W Poznaniu - American Dream Club',
      description:
        'American Dream Club: Jazz Club & Restauracja Z Muzyką Na Żywo W Centrum Poznania, Przy Płycie Starego Rynku. Koncerty, Kolacje, Wieczory Tematyczne Przy Dominikańskiej 9.',
      h1: 'Jazz Club & Restauracja Z Muzyką Na Żywo W Poznaniu',
      keywords: [
        'muzyka na żywo poznań',
        'jazz club poznań',
        'klub jazzowy poznań',
        'restauracja z muzyką na żywo poznań',
        'poznań muzyka na żywo',
      ],
    },
    en: {
      title: 'Jazz Club & Restaurant With Live Music In Poznań - American Dream Club',
      description:
        'American Dream Club: A Jazz Club & Restaurant With Live Music In The Heart Of Poznań, By The Old Market Square. Concerts, Dinners And Themed Evenings At Dominikańska 9.',
      h1: 'Jazz Club & Restaurant With Live Music In Poznań',
      keywords: [
        'live music poznań',
        'jazz club poznań',
        'music club poznań',
        'restaurant with live music poznań',
        'poznań live music',
      ],
    },
  },
  restaurant: {
    pl: {
      title: 'Restauracja Z Muzyką Na Żywo W Poznaniu - American Dream Club',
      description:
        'Restauracja Amerykańska W Centrum Poznania. Kolacja, Muzyka Na Żywo I Przestrzeń Na Spotkania Towarzyskie Oraz Okazjonalne.',
      h1: 'Restauracja Z Muzyką Na Żywo W Poznaniu',
      keywords: [
        'restauracja z muzyką na żywo poznań',
        'restauracja amerykańska poznań',
        'restauracja z tańcami poznań',
        'restauracja poznań',
        'poznań restauracje',
      ],
    },
    en: {
      title: 'Restaurant With Live Music In Poznań - American Dream Club',
      description:
        'An American Restaurant In The Centre Of Poznań. Dinner, Live Music And A Space For Social And Special Occasions.',
      h1: 'Restaurant With Live Music In Poznań',
      keywords: [
        'restaurant with live music poznań',
        'american restaurant poznań',
        'restaurant with dancing poznań',
        'restaurant poznań',
        'poznań restaurants',
      ],
    },
  },
  'bar-and-cocktails': {
    pl: {
      title: 'Cocktail Bar & Jazz Bar Poznań - American Dream Club',
      description:
        'Autorskie Koktajle, Klasyczne Drinki I Klimat Jazz Baru W Centrum Poznania. Idealne Miejsce Na Wieczorne Wyjście.',
      h1: 'Cocktail Bar & Jazz Bar W Poznaniu',
      keywords: [
        'cocktail bar poznań',
        'jazz bar poznań',
        'drink bar poznań',
        'koktajl bar poznań',
        'bar poznań',
      ],
    },
    en: {
      title: 'Cocktail Bar & Jazz Bar Poznań - American Dream Club',
      description:
        'Signature Cocktails, Classic Drinks And A Jazz-Bar Atmosphere In The Centre Of Poznań. The Perfect Place For A Night Out.',
      h1: 'Cocktail Bar & Jazz Bar In Poznań',
      keywords: [
        'cocktail bar poznań',
        'jazz bar poznań',
        'drink bar poznań',
        'cocktails poznań',
        'bar poznań',
      ],
    },
  },
  'cigar-lounge': {
    pl: {
      title: 'Cigar Lounge Poznań - American Dream Club',
      description:
        'Kameralna Strefa Cigar Lounge W Centrum Poznania. Miejsce Dla Gości Ceniących Spokój, Premium Klimat I Wieczorne Spotkania.',
      h1: 'Cigar Lounge W Centrum Poznania',
      keywords: ['cigar lounge poznań', 'cigar lounge', 'cigar bar', 'cigar lounge near me', 'cigar lounges'],
    },
    en: {
      title: 'Cigar Lounge Poznań - American Dream Club',
      description:
        'An Intimate Cigar Lounge In The Centre Of Poznań. A Place For Guests Who Value Calm, A Premium Atmosphere And Evening Gatherings.',
      h1: 'Cigar Lounge In The Centre Of Poznań',
      keywords: ['cigar lounge poznań', 'cigar lounge', 'cigar bar', 'cigar lounge near me', 'cigar lounges'],
    },
  },
  events: {
    pl: {
      title: 'Koncert, Muzyka Na Żywo Poznań - American Dream Club',
      description:
        'Sprawdź Najbliższe Koncerty I Wydarzenia Z Muzyką Na Żywo W Poznaniu. Rezerwuj Stolik I Poznaj Kalendarz Eventów ADC.',
      h1: 'Wydarzenia I Muzyka Na Żywo W Poznaniu',
      keywords: [
        'muzyka na żywo poznań',
        'klub muzyczny poznań',
        'kluby muzyczne poznań',
        'pub z muzyką na żywo',
        'poznań kluby muzyczne',
      ],
    },
    en: {
      title: 'Concerts & Live Music In Poznań - American Dream Club',
      description:
        'Check The Upcoming Concerts And Live-Music Events In Poznań. Book A Table And Explore The ADC Event Calendar.',
      h1: 'Events And Live Music In Poznań',
      keywords: [
        'live music poznań',
        'music club poznań',
        'music clubs poznań',
        'pub with live music',
        'poznań music clubs',
      ],
    },
  },
  business: {
    pl: {
      title: 'Organizacja Imprez Poznań - American Dream Club',
      description:
        'Organizacja Imprez Firmowych, Spotkań Świątecznych I Wydarzeń Okolicznościowych W Centrum Poznania. Wsparcie Od Scenariusza Po Realizację.',
      h1: 'Organizacja Imprez Poznań',
      keywords: [
        'impreza firmowa poznań',
        'organizacja imprez firmowych poznań',
        'eventy firmowe restauracja poznań',
        'wigilia firmowa poznań',
        'gdzie zorganizować imprezę firmową poznań',
      ],
    },
    en: {
      title: 'Event Organisation In Poznań - American Dream Club',
      description:
        'Organisation Of Corporate Events, Christmas Parties And Special Occasions In The Centre Of Poznań. Support From Concept To Delivery.',
      h1: 'Event Organisation In Poznań',
      keywords: [
        'corporate event poznań',
        'corporate event organisation poznań',
        'company events restaurant poznań',
        'company christmas party poznań',
        'where to organise a company event poznań',
      ],
    },
  },
  news: {
    pl: {
      title: 'Aktualności - American Dream Club',
      description:
        'Bieżące Informacje, Zapowiedzi Wydarzeń I Komunikaty Restauracji Oraz Klubu Muzycznego American Dream Club W Poznaniu.',
      h1: 'Aktualności',
    },
    en: {
      title: 'News - American Dream Club',
      description:
        'Current News, Event Announcements And Updates From The American Dream Club Restaurant And Music Club In Poznań.',
      h1: 'News',
    },
  },
  'pod-papugami': {
    pl: {
      title: 'Pod Papugami To Teraz American Dream Club - American Dream Club',
      description:
        'Kontekst Marki Pod Papugami I Obecna Oferta American Dream Club W Poznaniu. Informacja Dla Osób Szukających „Pod Papugami".',
      h1: 'Pod Papugami To Teraz American Dream Club',
      keywords: [
        'pod papugami poznań',
        'pod papugami poznań repertuar',
        'klub pod papugami',
        'restauracja pod papugami poznań',
        'pod papugami menu',
      ],
    },
    en: {
      title: 'Pod Papugami Is Now American Dream Club - American Dream Club',
      description:
        'The Story Behind The Pod Papugami Brand And The Current American Dream Club Offer In Poznań. For Everyone Searching For "Pod Papugami".',
      h1: 'Pod Papugami Is Now American Dream Club',
      keywords: [
        'pod papugami poznań',
        'pod papugami poznań repertoire',
        'pod papugami club',
        'pod papugami restaurant poznań',
        'pod papugami menu',
      ],
    },
  },
}

/** Zwraca wpis audytu dla klucza + locale. */
export function auditEntry(key: Key, locale: Locale): AuditEntry {
  return AUDIT_SEO[key][locale]
}

/** Wariant tolerujący nieznany klucz (np. dowolny slug z [slug]). */
export function getAuditEntry(key: string, locale: Locale): AuditEntry | undefined {
  return (AUDIT_SEO as Record<string, Record<Locale, AuditEntry>>)[key]?.[locale]
}

/** Buduje dynamiczny tytuł „{Nazwa} - American Dream Club" (Title Case). */
export function brandTitle(name: string | null | undefined): string {
  const normalized = toTitleCase(name) || BRAND
  return `${normalized} - ${BRAND}`
}

/** Przycina opis do ~180 znaków (audyt) i normalizuje do Title Case. */
export function brandDescription(text: string | null | undefined, max = 180): string | undefined {
  if (!text) return undefined
  const trimmed = text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
  return toTitleCase(trimmed)
}

/**
 * Składa obiekt Next `Metadata` z gotowych pól, wymuszając Title Case na
 * title/description i ustawiając `title.absolute` (format audytu) + keywords +
 * alternates (canonical/hreflang) + openGraph.
 */
export function buildMetadata(params: {
  locale: Locale
  /** ścieżka po locale, bez wiodącego slasha (np. 'events', 'news/pod-papugami') */
  path: string
  /** pełny tytuł (z „- American Dream Club"); zostanie znormalizowany do Title Case */
  title: string
  description?: string | null
  keywords?: string[]
  ogImageUrl?: string | null
}): Metadata {
  const title = toTitleCase(params.title)
  const description = params.description ? toTitleCase(params.description) : undefined
  const ogImages = params.ogImageUrl ? [{ url: params.ogImageUrl }] : ['/og-image.jpg']

  return {
    title: { absolute: title },
    description,
    ...(params.keywords?.length ? { keywords: params.keywords } : {}),
    alternates: localizedAlternates(params.locale, params.path),
    openGraph: {
      title,
      description: description ?? undefined,
      images: ogImages,
    },
  }
}
