import type { Block } from 'payload'

export const EventsCalendar: Block = {
  slug: 'eventsCalendar',
  interfaceName: 'EventsCalendarBlock',
  admin: {
    group: 'Events',
  },
  fields: [
    // ── Variant ──────────────────────────────────────────────────────────
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'teaser',
      options: [
        { label: 'Teaser — horizontal carousel with gold background', value: 'teaser' },
        { label: 'Full calendar — month grid view', value: 'full' },
      ],
      admin: {
        description: 'Choose how the calendar is displayed',
      },
    },

    // ── Color scheme (teaser only) ───────────────────────────────────────
    {
      name: 'colorScheme',
      type: 'select',
      defaultValue: 'gold',
      options: [
        { label: 'Gold background', value: 'gold' },
        { label: 'White background with lines', value: 'white' },
      ],
      admin: {
        condition: (_data, siblingData) => siblingData?.variant === 'teaser',
        description: 'Background style for the teaser carousel',
      },
    },

    // ── Heading & CTA ─────────────────────────────────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'heading',
          type: 'text',
          localized: true,
          admin: {
            width: '50%',
            placeholder: 'NADCHODZĄCE WYDARZENIA',
          },
        },
        {
          name: 'ctaLabel',
          type: 'text',
          localized: true,
          admin: {
            width: '25%',
            placeholder: 'ZAREZERWUJ STOLIK',
            description: 'CTA button label',
          },
        },
        {
          name: 'ctaUrl',
          type: 'text',
          admin: {
            width: '25%',
            placeholder: 'https://...',
            description: 'CTA button URL',
          },
        },
      ],
    },

    // ── Events source (teaser only) ───────────────────────────────────────
    {
      name: 'eventsSource',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Auto — show next upcoming events automatically', value: 'auto' },
        { label: 'Manual — pick specific featured events', value: 'manual' },
      ],
      admin: {
        condition: (_data, siblingData) => siblingData?.variant === 'teaser',
        description: 'How to populate the teaser carousel',
      },
    },
    {
      name: 'autoCount',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 12,
      admin: {
        condition: (_data, siblingData) => siblingData?.variant === 'teaser' && siblingData?.eventsSource !== 'manual',
        description: 'How many upcoming events to show',
      },
    },
    {
      name: 'manualEvents',
      type: 'relationship',
      relationTo: 'events' as any,
      hasMany: true,
      admin: {
        condition: (_data, siblingData) => siblingData?.variant === 'teaser' && siblingData?.eventsSource === 'manual',
        description: 'Select specific events to show in the teaser (only events marked as Featured appear here)',
      },
    },
  ],
}
