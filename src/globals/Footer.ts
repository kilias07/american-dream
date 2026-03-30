import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navColumns',
      type: 'array',
      label: 'Navigation Columns',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'heading',
          type: 'text',
          required: true,
          localized: true,
          label: 'Column Heading',
        },
        {
          name: 'links',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'url', type: 'text', required: true },
            { name: 'newTab', type: 'checkbox', defaultValue: false },
          ],
        },
      ],
    },
    {
      name: 'bottomBarLinks',
      type: 'array',
      label: 'Bottom Bar Links',
      admin: { initCollapsed: true },
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Links',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Google', value: 'google' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
          ],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_footer')
        } catch {
          // Outside Next.js context
        }
      },
    ],
  },
}
