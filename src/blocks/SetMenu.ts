import type { Block } from 'payload'

export const SetMenu: Block = {
  slug: 'setMenu',
  interfaceName: 'SetMenuBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'Dinner Time',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      admin: {
        placeholder: '3-daniowa kolacja degustacyjna w stałej cenie',
      },
    },
    {
      name: 'dateLabel',
      type: 'text',
      admin: {
        placeholder: '02.07',
      },
    },
    {
      name: 'menus',
      type: 'array',
      label: 'Menu',
      fields: [
        {
          name: 'name',
          type: 'text',
          localized: true,
          admin: {
            placeholder: 'MENU A',
          },
        },
        {
          name: 'price',
          type: 'number',
        },
        {
          name: 'courses',
          type: 'array',
          fields: [
            {
              name: 'courseLabel',
              type: 'text',
              localized: true,
              admin: {
                placeholder: 'PRZYSTAWKA / ZUPA / ...',
              },
            },
            {
              name: 'dish',
              type: 'text',
              localized: true,
            },
            {
              name: 'description',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
  ],
}
