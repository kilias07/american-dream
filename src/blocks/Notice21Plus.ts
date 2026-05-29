import type { Block } from 'payload'

export const Notice21Plus: Block = {
  slug: 'notice21Plus',
  interfaceName: 'Notice21PlusBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'Szanowni Goście',
      },
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
      admin: {
        placeholder: 'REGULAMIN KLUBU 21+',
      },
    },
    {
      name: 'ctaUrl',
      type: 'text',
    },
  ],
}
