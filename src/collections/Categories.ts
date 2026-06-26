import type { CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            if (!value && data?.title) {
              return (data.title as string)
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
            }
            return value
          },
        ],
      },
    },
  ],
  // Category names appear on cached news/article pages — bust those caches.
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('posts', 'max')
          revalidateTag('pages', 'max')
        } catch {
          // Outside Next.js context (e.g. seed script)
        }
      },
    ],
    afterDelete: [
      () => {
        try {
          revalidateTag('posts', 'max')
          revalidateTag('pages', 'max')
        } catch {}
      },
    ],
  },
}
