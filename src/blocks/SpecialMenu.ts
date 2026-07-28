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
    // Personalizacja banera (uwaga klienta 2026-07: kontener wielokrotnego
    // użytku — różne eventy potrzebują różnych fontów i kolorów).
    {
      type: 'row',
      fields: [
        {
          name: 'headingFont',
          type: 'text',
          label: 'Czcionka nagłówka (Google Font)',
          admin: {
            width: '50%',
            placeholder: 'np. Great Vibes, Lobster, Playfair Display',
            description:
              'Dokładna nazwa fontu z fonts.google.com — zostanie doładowany automatycznie. Puste = domyślna (Playfair Display italic).',
          },
        },
        {
          name: 'headingColor',
          type: 'text',
          label: 'Kolor nagłówka',
          validate: (value: string | null | undefined) =>
            !value || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
              ? true
              : 'Podaj kolor w formacie HEX, np. #14213D',
          admin: {
            width: '25%',
            placeholder: '#14213D',
            description: 'HEX, np. #14213D. Puste = granatowy.',
          },
        },
        {
          name: 'bodyColor',
          type: 'text',
          label: 'Kolor tekstu opisu',
          validate: (value: string | null | undefined) =>
            !value || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
              ? true
              : 'Podaj kolor w formacie HEX, np. #FFFFFF',
          admin: {
            width: '25%',
            placeholder: '#FFFFFF',
            description: 'HEX. Puste = biały.',
          },
        },
      ],
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
