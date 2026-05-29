import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const Musicians: CollectionConfig = {
  slug: 'musicians',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'instrument', 'order'],
    description: 'Musicians and performers featured on the site.',
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
    },
    slugField(),
    {
      name: 'instrument',
      type: 'text',
      localized: true,
      admin: { placeholder: 'SAKSOFON' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Controls display order (lower numbers first)',
      },
    },
  ],
}
