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
        },
        {
          name: 'ctaUrl',
          type: 'text',
        },
      ],
    },
  ],
}
