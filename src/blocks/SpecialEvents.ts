import type { Block } from 'payload'

export const SpecialEvents: Block = {
  slug: 'specialEvents',
  interfaceName: 'SpecialEventsBlock',
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
        placeholder: 'WYDARZENIA SPECJALNE',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 4,
    },
  ],
}
