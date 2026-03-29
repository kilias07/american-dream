import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { link } from '../fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    // Top bar
    {
      name: 'topBarText',
      type: 'text',
      localized: true,
      admin: {
        description: 'Announcement text shown in the top bar',
      },
    },
    {
      name: 'phone',
      type: 'text',
      admin: {
        description: 'Phone number shown in the top bar',
      },
    },
    {
      name: 'address',
      type: 'text',
      admin: {
        description: 'Physical address shown in the top bar',
      },
    },
    // Social media links
    {
      name: 'socialLinks',
      type: 'array',
      maxRows: 8,
      admin: {
        description: 'Social media icons shown on the left side of the nav',
      },
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
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            description: 'Full URL (e.g. https://facebook.com/...)',
          },
        },
      ],
    },
    // Left navigation (before logo)
    {
      name: 'navItemsLeft',
      type: 'array',
      maxRows: 4,
      admin: {
        description: 'Navigation links shown to the left of the logo',
        initCollapsed: true,
        components: {
          RowLabel: '@/globals/Header/RowLabel#RowLabel',
        },
      },
      fields: [link({ appearances: false })],
    },
    // Right navigation (after logo)
    {
      name: 'navItemsRight',
      type: 'array',
      maxRows: 4,
      admin: {
        description: 'Navigation links shown to the right of the logo',
        initCollapsed: true,
        components: {
          RowLabel: '@/globals/Header/RowLabel#RowLabel',
        },
      },
      fields: [link({ appearances: false })],
    },
    // CTA button (optional) — enable toggle
    {
      name: 'ctaEnabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Show CTA Button',
    },
    link({
      appearances: false,
      overrides: {
        name: 'ctaButton',
        admin: {
          description: 'Call-to-action button (e.g., Reservation / Rezerwacja)',
          condition: (data) => Boolean(data?.ctaEnabled),
        },
      },
    }),
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_header')
        } catch {
          // Outside Next.js context
        }
      },
    ],
  },
}
