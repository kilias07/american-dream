import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Logo shown in the footer' },
    },
    {
      name: 'newsletter',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text', localized: true },
        { name: 'placeholder', type: 'text', localized: true },
        { name: 'buttonLabel', type: 'text', localized: true },
        { name: 'consentText', type: 'text', localized: true },
      ],
    },
    {
      name: 'ageBadge',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show 21+ age badge',
    },
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
    // Social links live in the "Site Settings" global (single source of truth);
    // the footer reads them from there.
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_footer', 'max')
        } catch {
          // Outside Next.js context
        }
      },
    ],
  },
}
