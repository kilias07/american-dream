import type { CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'isRecurring', 'featured'],
    description: 'Manage events and performances. Use recurring events to avoid creating entries manually each week.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    // ── Basic info ─────────────────────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      admin: { placeholder: 'Chicago – Szalone Lata Dwudzieste' },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: { description: 'Short description shown on event cards' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Photo shown as card background' },
    },

    // ── Date & time ────────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
          admin: {
            width: '50%',
            description: 'Start date (and time) of the event. For recurring events this is the first occurrence.',
            date: {
              pickerAppearance: 'dayAndTime',
              displayFormat: 'dd/MM/yyyy HH:mm',
            },
          },
        },
        {
          name: 'endTime',
          type: 'text',
          admin: {
            width: '50%',
            description: 'End time in HH:MM format',
            placeholder: '21:00',
          },
        },
      ],
    },

    // ── Pricing & tickets ──────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          admin: {
            width: '50%',
            description: 'Ticket price in PLN (leave empty if free)',
            step: 5,
          },
        },
        {
          name: 'ticketUrl',
          type: 'text',
          admin: {
            width: '50%',
            description: 'External URL to buy tickets',
            placeholder: 'https://...',
          },
        },
      ],
    },

    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Mark this event to make it available for manual teaser selection',
      },
    },

    // ── Recurrence ─────────────────────────────────────────────────────────
    {
      name: 'isRecurring',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Enable if this event repeats on a regular schedule',
      },
    },
    {
      name: 'repeatType',
      type: 'select',
      options: [
        { label: 'Weekly — same day(s) every week', value: 'weekly' },
        { label: 'Monthly — same date every month', value: 'monthly' },
      ],
      admin: {
        condition: (data) => Boolean(data?.isRecurring),
        description: 'How often the event repeats',
      },
    },
    {
      name: 'repeatDays',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Monday', value: 'mon' },
        { label: 'Tuesday', value: 'tue' },
        { label: 'Wednesday', value: 'wed' },
        { label: 'Thursday', value: 'thu' },
        { label: 'Friday', value: 'fri' },
        { label: 'Saturday', value: 'sat' },
        { label: 'Sunday', value: 'sun' },
      ],
      admin: {
        condition: (data) => Boolean(data?.isRecurring) && data?.repeatType === 'weekly',
        description: 'Which days of the week this event occurs on',
      },
    },
    {
      name: 'repeatUntil',
      type: 'date',
      admin: {
        condition: (data) => Boolean(data?.isRecurring),
        description: 'Last date of the recurrence (leave empty to repeat indefinitely)',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'dd/MM/yyyy',
        },
      },
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('events')
        } catch {
          // Outside Next.js context
        }
      },
    ],
    afterDelete: [
      () => {
        try {
          revalidateTag('events')
        } catch {}
      },
    ],
  },
}
