import type { Block } from 'payload'

export const PageHero: Block = {
  slug: 'pageHero',
  interfaceName: 'PageHeroBlock',
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
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'titleStyle',
      type: 'select',
      defaultValue: 'serif',
      options: [
        { label: 'Serif', value: 'serif' },
        { label: 'Uppercase', value: 'uppercase' },
      ],
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      // Not required — shows brand gradient fallback until real photo is uploaded via CMS
    },
    {
      type: 'row',
      fields: [
        {
          name: 'inlineLinkLabel',
          type: 'text',
          localized: true,
          admin: {
            width: '50%',
            placeholder: 'NASZE MENU ›',
          },
        },
        {
          name: 'inlineLinkUrl',
          type: 'text',
          admin: {
            width: '50%',
          },
        },
      ],
    },
  ],
}
