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

    // ── Event template & detail content ──────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'eventType',
          type: 'select',
          defaultValue: 'standard',
          options: [
            { label: 'Standard', value: 'standard' },
            { label: 'Special (WYDARZENIE SPECJALNE)', value: 'special' },
          ],
          admin: { width: '50%', description: 'Controls badge/styling on the program + detail pages' },
        },
        {
          name: 'leadTitle',
          type: 'text',
          localized: true,
          admin: { width: '50%', description: 'Eyebrow above the title (e.g. "Muzyka na żywo", "Recital")' },
        },
      ],
    },
    {
      name: 'genres',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { description: 'Genre/category chips (JAZZ, SWING, MUZYKA KLASYCZNA…)' },
    },
    {
      name: 'posterImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Poster artwork (used in the special-events carousel)' },
    },
    {
      name: 'descriptionHeading',
      type: 'text',
      localized: true,
      admin: { description: 'Heading above the long description on the event detail page' },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      admin: { description: 'Full description shown on the event detail page' },
    },
    {
      name: 'performers',
      type: 'array',
      admin: { description: 'Musicians performing at this event', initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'musician', type: 'relationship', relationTo: 'musicians', admin: { width: '50%' } },
            { name: 'instrument', type: 'text', localized: true, admin: { width: '50%', placeholder: 'saksofon' } },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'room', type: 'relationship', relationTo: 'rooms', admin: { width: '50%', description: 'Which room/strefa' } },
        { name: 'recurringSeries', type: 'relationship', relationTo: 'recurring-series', admin: { width: '50%', description: 'Part of a recurring series (cykliczne)' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'reservationUrl', type: 'text', admin: { width: '50%', description: 'Overrides the global reservation link', placeholder: 'https://...' } },
        { name: 'shareEnabled', type: 'checkbox', defaultValue: true, admin: { width: '50%', description: 'Show social share buttons' } },
      ],
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
          revalidateTag('events', 'max')
        } catch {
          // Outside Next.js context
        }
      },
    ],
    afterDelete: [
      () => {
        try {
          revalidateTag('events', 'max')
        } catch {}
      },
    ],
  },
}
