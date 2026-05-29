import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
    },
    {
      name: 'address',
      type: 'text',
      localized: true,
    },
    {
      name: 'phones',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        { name: 'label', type: 'text' },
        { name: 'number', type: 'text' },
      ],
    },
    {
      name: 'emails',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        { name: 'label', type: 'text' },
        { name: 'email', type: 'email' },
      ],
    },
    {
      name: 'social',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Google', value: 'google' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
          ],
        },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'mapEmbedUrl',
      type: 'text',
    },
    {
      name: 'reservationUrl',
      type: 'text',
      admin: {
        description: 'Default booking / ticket link',
      },
    },
    {
      name: 'reviewAggregate',
      type: 'text',
      localized: true,
      admin: {
        placeholder: '500+ opinii · 4,8/5',
      },
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_site_settings', 'max')
        } catch {
          // Outside Next.js context
        }
      },
    ],
  },
}
