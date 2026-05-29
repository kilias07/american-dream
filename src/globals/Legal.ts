import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

export const Legal: GlobalConfig = {
  slug: 'legal',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'regulamin',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'privacy',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'companyData',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'age21Notice',
      type: 'textarea',
      localized: true,
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_legal', 'max')
        } catch {
          // Outside Next.js context
        }
      },
    ],
  },
}
