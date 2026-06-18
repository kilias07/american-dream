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
      name: 'headingScript',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'specials',
        description: 'Decorative script accent shown under the heading (e.g. "specials").',
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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Background photo for the header banner (Dinner Time Specials).',
      },
    },
    {
      name: 'dateLabel',
      type: 'text',
      admin: {
        placeholder: '69 zł / os.',
        description: 'Price / date shown in the outlined badge.',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Intro paragraph shown in the header banner.',
      },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'ZAREZERWUJ STOLIK',
      },
    },
    {
      name: 'ctaUrl',
      type: 'text',
      admin: {
        placeholder: '/rezerwacje',
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
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Photo shown to the left of this menu (design: MENU A / MENU B).',
          },
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
