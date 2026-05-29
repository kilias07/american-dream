import type { Block } from 'payload'

export const EventsTeaser: Block = {
  slug: 'eventsTeaser',
  interfaceName: 'EventsTeaserBlock',
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
        placeholder: 'PROGRAM',
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
      defaultValue: 6,
    },
    {
      name: 'onlyFeatured',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
