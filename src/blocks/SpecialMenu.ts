import type { Block } from 'payload'

/**
 * Special-menu panel (design: ADC_Restauracja "Towarzyska Niedziela"). One gold
 * rounded panel = a photo banner on top (logo/heading + intro + reservation CTA)
 * followed by a two-column priced menu with dietary icons, a legend and a VAT note.
 * Items live inline so the whole offer is editable in one place.
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
      name: 'categories',
      type: 'array',
      labels: { singular: 'Category', plural: 'Categories' },
      admin: {
        description: 'Menu sections (e.g. Przystawki, Zupy). Use the column field to place each one left or right.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          admin: { placeholder: 'PRZYSTAWKI' },
        },
        {
          name: 'column',
          type: 'select',
          defaultValue: 'left',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
        },
        {
          name: 'items',
          type: 'array',
          labels: { singular: 'Dish', plural: 'Dishes' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'name', type: 'text', localized: true, admin: { width: '70%' } },
                { name: 'price', type: 'number', admin: { width: '30%' } },
              ],
            },
            {
              name: 'ingredients',
              type: 'textarea',
              localized: true,
              admin: { placeholder: 'składnik / składnik / …' },
            },
            {
              name: 'dietary',
              type: 'select',
              options: [
                { label: '— none —', value: 'none' },
                { label: 'Vegetarian (V)', value: 'v' },
                { label: 'Vegan (VG)', value: 'vg' },
                { label: 'For two (2 os.)', value: 'pair' },
              ],
              defaultValue: 'none',
            },
          ],
        },
      ],
    },
    {
      name: 'notice',
      type: 'textarea',
      localized: true,
      admin: { description: 'Fine print shown at the bottom (prices / VAT / allergens).' },
    },
  ],
}
