import type { Block } from 'payload'

export const NewsCarousel: Block = {
  slug: 'newsCarousel',
  interfaceName: 'NewsCarouselBlock',
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
      admin: {
        placeholder: 'AKTUALNOŚCI',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'viewAllLabel',
          type: 'text',
          localized: true,
          admin: {
            width: '50%',
          },
        },
        {
          name: 'viewAllUrl',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
    },
  ],
}
