import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const RecurringSeries: CollectionConfig = {
  slug: 'recurring-series',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'themeColor', 'updatedAt'],
    description: 'Recurring event series with their own branding and gallery.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField(),
    {
      name: 'wordmarkImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Series logo/wordmark' },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'themeColor',
      type: 'select',
      defaultValue: 'amber',
      options: [
        { label: 'Amber', value: 'amber' },
        { label: 'Black & White', value: 'blackwhite' },
        { label: 'Sepia', value: 'sepia' },
        { label: 'Purple', value: 'purple' },
      ],
    },
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
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
