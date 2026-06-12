import type { GlobalConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { revalidateTag } from 'next/cache'

export const Legal: GlobalConfig = {
  slug: 'legal',
  admin: {
    group: 'Settings',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'regulamin',
      label: 'Regulamin klubu',
      type: 'richText',
      editor: lexicalEditor(),
      localized: true,
    },
    {
      name: 'privacy',
      label: 'Polityka prywatności',
      type: 'richText',
      editor: lexicalEditor(),
      localized: true,
    },
    {
      name: 'companyData',
      label: 'Dane firmy',
      type: 'richText',
      editor: lexicalEditor(),
      localized: true,
    },
    {
      name: 'age21Notice',
      label: 'Informacja 21+',
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
