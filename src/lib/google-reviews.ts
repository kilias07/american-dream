import { unstable_cache } from 'next/cache'

/**
 * Opinie Google (uwaga klienta 2026-07, C7) — Places API (New), Place Details.
 *
 * Fetch WYŁĄCZNIE server-side (klucz nigdy nie trafia do przeglądarki),
 * w `unstable_cache` z tagiem `google-reviews` i odświeżaniem co 6 h —
 * przy 2 locale to ~8 zapytań/dobę (koszt pomijalny). Ręczne odświeżenie:
 * POST /api/revalidate { "tag": "google-reviews" }.
 *
 * FALLBACK: brak klucza / Place ID / błąd / pusto → zwraca null, a komponent
 * testimonials renderuje opinie wpisane ręcznie w CMS (zero regresji).
 * Wpięcie integracji = ustawienie sekretów, bez zmian w kodzie:
 *   wrangler secret put GOOGLE_PLACES_API_KEY
 *   wrangler secret put GOOGLE_PLACE_ID        (format "ChIJ…", Place ID finder)
 * Lokalne dev: te same zmienne w .env.
 *
 * Ograniczenia Places API: max 5 opinii („najtrafniejsze", niekoniecznie
 * najnowsze), jeden język na zapytanie, bywają opinie bez tekstu (filtrujemy).
 */

export type GoogleReviewItem = { name: string; stars: number; text: string }
export type GoogleReviewsData = {
  rating: number
  userRatingCount: number
  reviews: GoogleReviewItem[]
}

type PlacesResponse = {
  rating?: number
  userRatingCount?: number
  reviews?: {
    rating?: number
    text?: { text?: string }
    originalText?: { text?: string }
    authorAttribution?: { displayName?: string }
  }[]
}

async function fetchGoogleReviews(locale: string): Promise<GoogleReviewsData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  const placeId = process.env.GOOGLE_PLACE_ID
  if (!apiKey || !placeId) return null

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${locale === 'en' ? 'en' : 'pl'}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'rating,userRatingCount,reviews',
        },
      },
    )
    if (!res.ok) return null
    const data = (await res.json()) as PlacesResponse
    if (typeof data.rating !== 'number') return null

    const reviews: GoogleReviewItem[] = (data.reviews ?? [])
      .map((r) => ({
        name: r.authorAttribution?.displayName || 'Gość',
        stars: Math.max(1, Math.min(5, Math.round(r.rating ?? 5))),
        text: (r.text?.text || r.originalText?.text || '').trim(),
      }))
      .filter((r) => r.text.length > 0)

    if (reviews.length === 0) return null
    return { rating: data.rating, userRatingCount: data.userRatingCount ?? 0, reviews }
  } catch {
    return null
  }
}

/** Cache'owane opinie Google dla locale — null gdy integracja nieaktywna. */
export function getGoogleReviews(locale: string): Promise<GoogleReviewsData | null> {
  const cached = unstable_cache(
    () => fetchGoogleReviews(locale),
    [`google-reviews-${locale}`],
    { tags: ['google-reviews'], revalidate: 21600 }, // 6 h
  )
  return cached()
}

/** „478 opinii · 4,8/5 w" — sufiks „Google" dokleja logo w komponencie. */
export function formatReviewSummary(data: GoogleReviewsData, locale: string): string {
  const rating = data.rating.toFixed(1).replace('.', locale === 'en' ? '.' : ',')
  const label = locale === 'en' ? 'reviews' : 'opinii'
  return `${data.userRatingCount} ${label} · ${rating}/5 ${locale === 'en' ? 'on' : 'w'}`
}
