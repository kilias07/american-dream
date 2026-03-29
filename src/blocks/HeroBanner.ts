import type { Block } from 'payload'
import { link } from '../fields/link'

export const HeroBanner: Block = {
  slug: 'heroBanner',
  labels: {
    singular: 'Hero Banner',
    plural: 'Hero Banners',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
    },
    {
      name: 'subtext',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
    },
    // Secondary outline buttons (e.g. MENU, PROGRAM)
    {
      name: 'secondaryLinks',
      type: 'array',
      label: 'Secondary Buttons',
      maxRows: 3,
      fields: [
        link({ appearances: false }),
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Fork (Menu)', value: 'fork' },
            { label: 'Music Note', value: 'music' },
            { label: 'Ticket', value: 'ticket' },
            { label: 'Calendar', value: 'calendar' },
          ],
        },
      ],
    },
    // Primary CTA button (gold filled)
    link({ appearances: false, overrides: { name: 'ctaLink', label: 'CTA Button' } }),
    {
      name: 'ctaIcon',
      type: 'select',
      label: 'CTA Button Icon',
      defaultValue: 'ticket',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Fork (Menu)', value: 'fork' },
        { label: 'Music Note', value: 'music' },
        { label: 'Ticket', value: 'ticket' },
        { label: 'Calendar', value: 'calendar' },
      ],
    },
  ],
}
