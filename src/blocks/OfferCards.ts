import type { Block } from 'payload'

export const OfferCards: Block = {
  slug: 'offerCards',
  interfaceName: 'OfferCardsBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'photo',
      options: [
        { label: 'Photo cards (image background)', value: 'photo' },
        { label: 'Framed cards (bordered, centered)', value: 'framed' },
      ],
      admin: { description: 'Visual style of the cards.' },
    },
    {
      name: 'cards',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'tag',
          type: 'text',
          localized: true,
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'body',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'ctaLabel',
          type: 'text',
          localized: true,
          admin: { description: 'Główny przycisk, np. „ZADZWOŃ I POZNAJ OFERTĘ".' },
        },
        {
          name: 'ctaUrl',
          type: 'text',
          admin: { description: 'np. tel:+48508090575, /events albo https://…' },
        },
        // Drugi, opcjonalny przycisk (uwaga klienta 2026-08): np. „ZADZWOŃ"
        // obok „POBIERZ OFERTĘ PDF". Pokazuje się tylko, gdy ma etykietę
        // i cel — plik z Mediów albo adres.
        {
          name: 'secondaryCtaLabel',
          type: 'text',
          localized: true,
          admin: { description: 'Drugi przycisk (opcjonalny), np. „POBIERZ OFERTĘ PDF".' },
        },
        {
          name: 'secondaryCtaFile',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Plik do pobrania (np. PDF). Ma pierwszeństwo przed adresem poniżej.',
          },
        },
        {
          name: 'secondaryCtaUrl',
          type: 'text',
          admin: {
            condition: (_data, siblingData) => !siblingData?.secondaryCtaFile,
            description: 'Adres drugiego przycisku, jeśli nie wskazujesz pliku.',
          },
        },
      ],
    },
  ],
}
