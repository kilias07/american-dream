import type { CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'

export const MenuCategories: CollectionConfig = {
  slug: 'menu-categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'menuType', 'order'],
    description: 'Categories that group menu items (e.g. Nikaragua, Przystawki, Koktajle).',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: { placeholder: 'KOKTAJLE AUTORSKIE' },
    },
    {
      name: 'menuType',
      type: 'select',
      required: true,
      options: [
        { label: 'Cigars', value: 'cigars' },
        { label: 'Cocktails', value: 'cocktails' },
        { label: 'Wine', value: 'wine' },
        { label: 'Food', value: 'food' },
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
  // Categories group menu items on statically-cached menu pages — bust `pages`.
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
