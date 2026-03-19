import type { Block } from 'payload'

export const ImageGallery: Block = {
  slug: 'imageGallery',
  labels: {
    singular: 'Image Gallery',
    plural: 'Image Galleries',
  },
  fields: [
    {
      name: 'images',
      type: 'array',
      required: true,
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
  ],
}
