import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { revalidateTag } from 'next/cache'

export const Rooms: CollectionConfig = {
  slug: 'rooms',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'capacity', 'order'],
    description: 'Bookable rooms and spaces (e.g. VIP ROOM).',
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
      admin: { placeholder: 'VIP ROOM' },
    },
    slugField(),
    {
      name: 'capacity',
      type: 'number',
      admin: { description: 'Maximum number of guests ("do N osób")' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'equipment',
      type: 'array',
      fields: [
        {
          name: 'item',
          type: 'text',
          localized: true,
        },
      ],
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
      ],
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
  // Rooms are embedded in pages (e.g. /business roomSelector) which are
  // statically cached under the `pages` tag — bust it so CMS edits show up.
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('pages', 'max')
        } catch {
          // Outside Next.js context (e.g. seed script)
        }
      },
    ],
    afterDelete: [
      () => {
        try {
          revalidateTag('pages', 'max')
        } catch {}
      },
    ],
  },
}
