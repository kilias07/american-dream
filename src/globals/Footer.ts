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
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/globals/Footer/RowLabel#RowLabel',
        },
      },
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
