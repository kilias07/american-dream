import type { CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'

export const MenuItems: CollectionConfig = {
  slug: 'menu-items',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'menuType', 'category', 'available', 'order'],
    description: 'Individual menu items — cocktails, food, wine and cigars.',
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
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'ingredients',
      type: 'textarea',
      localized: true,
      admin: { description: 'Ingredients list (mainly for cocktails)' },
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
      name: 'category',
      type: 'relationship',
      relationTo: 'menu-categories',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          admin: { width: '50%' },
        },
        {
          name: 'currency',
          type: 'text',
          defaultValue: 'zł',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'origin',
      type: 'text',
      localized: true,
      admin: { description: 'Country or region of origin' },
    },
    {
      name: 'variants',
      type: 'array',
      admin: { description: 'Variants of this item (e.g. SMASH BURGER CLASSIC / BBQ)' },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
        },
        {
          name: 'price',
          type: 'number',
        },
      ],
    },
    {
      name: 'tag',
      type: 'text',
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
    {
      name: 'available',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
  // Menu items are rendered into statically-cached pages (/restaurant,
  // /bar-and-cocktails, /cigar-lounge) via the menuSection block — bust the
  // `pages` cache so menu edits appear on the site.
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
