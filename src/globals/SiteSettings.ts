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
      label: 'Social Links',
      admin: {
        initCollapsed: true,
        description:
          'Single source of truth for social links across the whole site (header, mobile menu, footer, SEO). Edit here once — updates everywhere.',
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Google', value: 'google' },
            { label: 'Google Maps (wizytówka)', value: 'googleMaps' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
          ],
        },
        { name: 'url', type: 'text', required: true },
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
    {
      name: 'metaDescription',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Domyślny opis SEO strony (meta description / Open Graph), używany gdy strona nie ma własnego opisu.',
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
