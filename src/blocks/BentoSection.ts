import type { Block } from 'payload'

export const BentoSection: Block = {
  slug: 'bentoSection',
  interfaceName: 'BentoSectionBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    // ── Section header ────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'subheading',
          type: 'text',
          localized: true,
          admin: {
            width: '50%',
            placeholder: 'Sprawdź nadchodzące wydarzenia i zaplanuj swój wieczór',
          },
        },
        {
          name: 'heading',
          type: 'text',
          localized: true,
          admin: {
            width: '50%',
            placeholder: 'PROGRAM',
          },
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },

    // ── Cards ──────────────────────────────────────────────────────────────
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      maxRows: 12,
      admin: {
        description: 'Each item is a bento card. Set colSpan to control layout.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'colSpan',
          type: 'select',
          defaultValue: 'half',
          required: true,
          options: [
            { label: 'Half width (2 cards per row)', value: 'half' },
            { label: 'Full width (1 card per row)', value: 'full' },
          ],
          admin: {
            description: 'Controls how wide this card is in the grid',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              localized: true,
              admin: {
                width: '50%',
                placeholder: 'Autorskie koktajle, selekcja alkoholi...',
                description: 'Small description text above title',
              },
            },
            {
              name: 'title',
              type: 'text',
              localized: true,
              required: true,
              admin: {
                width: '50%',
                placeholder: 'COCKTAIL BAR',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'ctaLabel',
              type: 'text',
              localized: true,
              admin: {
                width: '50%',
                placeholder: 'MENU',
              },
            },
            {
              name: 'ctaUrl',
              type: 'text',
              admin: {
                width: '50%',
                placeholder: '/menu',
              },
            },
          ],
        },
      ],
    },
  ],
}
