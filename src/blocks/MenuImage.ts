import type { Block } from 'payload'

/**
 * Pasted-menu-as-image (design: ADC_CigarRoom — the cigar menu section).
 * The client uploads a ready-made menu graphic (the whole CYGARA / Nikaragua /
 * Dominikana / Kuba card as one image). One image is the common case; multiple
 * are supported for multi-page menus. With `enableLightbox` on, clicking a tile
 * opens the full-size graphic in an overlay.
 */
export const MenuImage: Block = {
  slug: 'menuImage',
  interfaceName: 'MenuImageBlock',
  labels: {
    singular: 'Menu (image)',
    plural: 'Menus (image)',
  },
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      admin: { placeholder: 'Karta' },
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: { placeholder: 'Cygara' },
    },
    {
      name: 'images',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Menu image', plural: 'Menu images' },
      admin: {
        description:
          'Upload the menu as a graphic. Add more than one only for multi-page menus.',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'enableLightbox',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Allow clicking the menu to enlarge it in a full-screen overlay.',
      },
    },
  ],
}
