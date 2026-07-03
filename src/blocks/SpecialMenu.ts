import type { Block } from 'payload'

/**
 * Special-menu panel (design: ADC_Restauracja "Towarzyska Niedziela"). One gold
 * rounded panel = a photo banner on top (logo/heading + intro + reservation CTA)
 * followed by the priced menu as ONE client-uploaded graphic (same approach as
 * the à-la-carte tiles and the cigar menu — the client pastes a ready-made menu
 * image in /admin instead of editing dishes field-by-field).
 */
export const SpecialMenu: Block = {
  slug: 'specialMenu',
  interfaceName: 'SpecialMenuBlock',
  admin: { group: 'Content' },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Background photo for the top banner.' },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional script wordmark shown over the banner (falls back to the heading text).' },
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: { placeholder: 'Towarzyska Niedziela' },
    },
    {
      name: 'subtitle',
      type: 'text',
      localized: true,
      admin: { placeholder: 'Specjalne menu i relaksująca atmosfera' },
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
      admin: { placeholder: 'ZAREZERWUJ STOLIK' },
    },
    {
      name: 'ctaUrl',
      type: 'text',
      admin: { placeholder: '/rezerwacje' },
    },
    {
      name: 'menuImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'The priced menu as one ready-made graphic (incl. prices, icons and the VAT note). Clicking it on the site opens a full-screen enlargement.',
      },
    },
  ],
}
