import type { Block } from 'payload'

export const MenuSection: Block = {
  slug: 'menuSection',
  interfaceName: 'MenuSectionBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'sectionTag',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'CYGARA',
      },
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
    },
    {
      name: 'menuType',
      type: 'select',
      required: true,
      options: [
        { label: 'Cigars', value: 'cigars' },
        { label: 'Cocktails', value: 'cocktails' },
        { label: 'Wine', value: 'wine' },
        { label: 'Food', value: 'food' },
      ],
      admin: {
        description: 'Which menu-items to show',
      },
    },
    {
      name: 'layout',
      type: 'select',
      required: true,
      defaultValue: 'pricedList',
      options: [
        { label: 'Priced List', value: 'pricedList' },
        { label: 'Card Grid', value: 'cardGrid' },
      ],
    },
    {
      name: 'groupByCategory',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'pdfDownload',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'ZOBACZ CAŁE MENU (PDF)',
      },
    },
  ],
}
