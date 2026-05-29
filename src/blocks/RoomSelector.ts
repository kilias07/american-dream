import type { Block } from 'payload'

export const RoomSelector: Block = {
  slug: 'roomSelector',
  interfaceName: 'RoomSelectorBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'DOSTĘPNE STREFY',
      },
    },
    {
      name: 'rooms',
      type: 'relationship',
      relationTo: 'rooms',
      hasMany: true,
      admin: {
        description: 'Optional. Leave empty to show all rooms by their order.',
      },
    },
    {
      name: 'equipmentHeading',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'WYPOSAŻENIE',
      },
    },
    {
      name: 'offerHeading',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'CO PRZYGOTUJEMY DLA CIEBIE',
      },
    },
    {
      name: 'offerItems',
      type: 'array',
      fields: [
        {
          name: 'item',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
}
