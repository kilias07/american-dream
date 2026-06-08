import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { revalidateTag } from 'next/cache'

export const Musicians: CollectionConfig = {
  slug: 'musicians',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'instrument', 'order'],
    description: 'Musicians and performers. Each has their own artist page (click a tile) with an editable bio.',
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
      name: 'role',
      type: 'text',
      localized: true,
      admin: { description: 'Optional role/eyebrow on the artist page (e.g. „Wokalistka”, „Lider zespołu”)' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Tile photo (also used as the artist page header if no header image is set)' },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional large header image for the artist page (falls back to the tile photo)' },
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      admin: { description: 'Short bio (lead paragraph on the artist page)' },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      admin: { description: 'Full biography / content shown on the artist’s page' },
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
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('musicians', 'max')
        } catch {
          // Outside Next.js context (e.g. seed script)
        }
      },
    ],
    afterDelete: [
      () => {
        try {
          revalidateTag('musicians', 'max')
        } catch {}
      },
    ],
  },
}
