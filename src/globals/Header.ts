import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { link } from '../fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [link({ appearances: false })],
      maxRows: 8,
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global-header')
        } catch {
          // Outside Next.js context
        }
      },
    ],
  },
}
