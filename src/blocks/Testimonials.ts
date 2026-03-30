import type { Block } from 'payload'

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
