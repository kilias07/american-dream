import type { Block } from 'payload'

/**
 * Photo gallery shown as a mosaic of tiles (design: ADC_CigarRoom gallery).
 * The editor controls the layout from the CMS: the number of columns, and each
 * tile's size (normal / wide / tall / large) so tiles can be arranged into a
 * bento-style mosaic. Clicking a tile opens it in a lightbox.
 */
export const ImageGallery: Block = {
  slug: 'imageGallery',
  labels: {
    singular: 'Image Gallery',
    plural: 'Image Galleries',
  },
  fields: [
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 columns', value: '2' },
        { label: '3 columns', value: '3' },
        { label: '4 columns', value: '4' },
      ],
      admin: {
        description: 'How many columns the mosaic uses on desktop.',
      },
    },
    {
      name: 'enableLightbox',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Allow clicking a photo to enlarge it in a full-screen overlay.',
      },
    },
    {
      name: 'images',
      type: 'array',
      required: true,
      labels: { singular: 'Photo', plural: 'Photos' },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'size',
          type: 'select',
          defaultValue: 'normal',
          options: [
            { label: 'Normal (1×1)', value: 'normal' },
            { label: 'Wide (2 columns)', value: 'wide' },
            { label: 'Tall (2 rows)', value: 'tall' },
            { label: 'Large (2×2)', value: 'large' },
          ],
          admin: {
            description: 'Tile size in the mosaic. Combine sizes to build the layout you want.',
          },
        },
        {
          name: 'caption',
          type: 'text',
          localized: true,
        },
      ],
    },
  ],
}
