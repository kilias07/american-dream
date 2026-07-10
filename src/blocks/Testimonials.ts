import type { Block } from 'payload'

/**
 * Opinie gości. Gdy skonfigurowane są sekrety GOOGLE_PLACES_API_KEY +
 * GOOGLE_PLACE_ID, komponent pokazuje RZECZYWISTE opinie i średnią z Google
 * (odświeżane co 6 h) — pola `reviewSummary`/`items` służą wtedy tylko jako
 * fallback. Bez kluczy działa jak dotąd: treści wpisane ręcznie poniżej.
 */
export const Testimonials: Block = {
  slug: 'testimonials',
  interfaceName: 'TestimonialsBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'heading',
          type: 'text',
          localized: true,
          admin: { width: '50%', placeholder: 'OPINIE NASZYCH GOŚCI' },
        },
        {
          name: 'reviewSummary',
          type: 'text',
          localized: true,
          admin: { width: '50%', placeholder: '500+ opinii · 4,8/5 w' },
        },
      ],
    },
    {
      // „Zostaw opinię" → wizytówka Google (uwaga klienta 2026-07, C8)
      type: 'row',
      fields: [
        {
          name: 'leaveReviewLabel',
          type: 'text',
          localized: true,
          admin: { width: '50%', placeholder: 'ZOSTAW OPINIĘ' },
        },
        {
          name: 'leaveReviewUrl',
          type: 'text',
          admin: { width: '50%', placeholder: 'https://g.page/r/…/review' },
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'stars',
          type: 'number',
          required: true,
          defaultValue: 5,
          min: 1,
          max: 5,
          admin: { step: 1 },
        },
        {
          name: 'text',
          type: 'textarea',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
