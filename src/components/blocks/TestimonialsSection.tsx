import React from 'react'
import type { Page } from '@/payload-types'
import { getGoogleReviews, formatReviewSummary } from '@/lib/google-reviews'
import { TestimonialsBlock } from './TestimonialsBlock'

type TestimonialsData = Extract<NonNullable<Page['layout']>[number], { blockType: 'testimonials' }>

/**
 * Serwerowy wrapper bloku `testimonials` (uwaga klienta 2026-07, C7/C8).
 *
 * Gdy integracja Google Places jest aktywna (sekrety GOOGLE_PLACES_API_KEY +
 * GOOGLE_PLACE_ID), podmienia ręczne `items` na RZECZYWISTE najnowsze opinie
 * Google i wylicza `reviewSummary` (liczba opinii + średnia). Bez klucza —
 * pełny fallback na treści z CMS (zero regresji).
 *
 * Przycisk „Zostaw opinię" (link do wizytówki) renderuje klient — label/url
 * edytowalne w bloku.
 */
export async function TestimonialsSection({
  block,
  locale,
}: {
  block: TestimonialsData
  locale: string
}) {
  const google = await getGoogleReviews(locale)

  const effectiveBlock: TestimonialsData = google
    ? {
        ...block,
        reviewSummary: formatReviewSummary(google, locale),
        items: google.reviews.map((r) => ({ name: r.name, stars: r.stars, text: r.text })),
      }
    : block

  const leaveReviewUrl = block.leaveReviewUrl || 'https://g.page/r/CdcevpeaTZVhEBM/review'
  const leaveReviewLabel =
    block.leaveReviewLabel || (locale === 'en' ? 'LEAVE A REVIEW' : 'ZOSTAW OPINIĘ')

  return (
    <TestimonialsBlock
      block={effectiveBlock}
      leaveReviewLabel={leaveReviewLabel}
      leaveReviewUrl={leaveReviewUrl}
    />
  )
}
