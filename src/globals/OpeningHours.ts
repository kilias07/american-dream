import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

export const OpeningHours: GlobalConfig = {
  slug: 'opening-hours',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'days',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'day',
          type: 'select',
          options: [
            { label: 'Monday', value: 'monday' },
            { label: 'Tuesday', value: 'tuesday' },
            { label: 'Wednesday', value: 'wednesday' },
            { label: 'Thursday', value: 'thursday' },
            { label: 'Friday', value: 'friday' },
            { label: 'Saturday', value: 'saturday' },
            { label: 'Sunday', value: 'sunday' },
          ],
        },
        {
          name: 'closed',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'openTime',
          type: 'text',
          admin: {
            placeholder: '17:00',
          },
        },
        {
          name: 'closeTime',
          type: 'text',
          admin: {
            placeholder: '23:00',
          },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_opening_hours', 'max')
        } catch {
          // Outside Next.js context
        }
      },
    ],
  },
}
