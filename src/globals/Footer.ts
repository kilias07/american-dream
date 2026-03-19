import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { link } from '../fields/link'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [link({ appearances: false })],
    },
    {
      name: 'copyright',
      type: 'text',
      localized: true,
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global-footer')
        } catch {
          // Outside Next.js context
        }
      },
    ],
  },
}
