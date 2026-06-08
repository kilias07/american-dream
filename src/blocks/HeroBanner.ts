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
      admin: {
        description:
          'Używane jako plakat filmu (przed załadowaniem) i fallback dla osób z ograniczoną animacją. Bez filmu — pełne tło.',
      },
    },
    {
      name: 'backgroundVideo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Film w tle hero — leci automatycznie, w pętli, wyciszony, lekko przyciemniony. Wgraj plik MP4 tutaj (trafia do magazynu R2). Zostaw puste, aby użyć tylko zdjęcia.',
      },
    },
    {
      name: 'backgroundVideoUrl',
      type: 'text',
      label: 'Background Video URL (zewnętrzny)',
      admin: {
        description:
          'Opcjonalnie: zewnętrzny URL filmu, jeśli nie wgrywasz pliku powyżej. Pole „Background Video” ma pierwszeństwo.',
      },
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
