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
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Site logo shown in the header' },
    },
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
    // Social media links live in the "Site Settings" global (single source of
    // truth). The header reads them from there — edit them once, updates
    // everywhere (header, mobile menu, footer, SEO).
    // Navigation links (logo sits on the left, links render after it)
    {
      name: 'navItems',
      type: 'array',
      maxRows: 8,
      admin: {
        description: 'Navigation links shown in the header',
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
          revalidateTag('global_header', 'max')
        } catch {
          // Outside Next.js context
        }
      },
    ],
  },
}
