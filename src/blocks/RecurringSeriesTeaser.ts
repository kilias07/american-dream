import type { Block } from 'payload'

export const RecurringSeriesTeaser: Block = {
  slug: 'recurringSeriesTeaser',
  interfaceName: 'RecurringSeriesTeaserBlock',
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
        placeholder: 'WYDARZENIA CYKLICZNE',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'series',
      type: 'relationship',
      relationTo: 'recurring-series',
      hasMany: true,
      admin: {
        description: 'Optional — leave empty to show all',
      },
    },
  ],
}
