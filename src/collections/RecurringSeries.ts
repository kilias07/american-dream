import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const RecurringSeries: CollectionConfig = {
  slug: 'recurring-series',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'themeColor', 'updatedAt'],
    description: 'Recurring event series with their own branding and gallery.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField(),
    {
      name: 'wordmarkImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Series logo/wordmark' },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'themeColor',
      type: 'select',
      defaultValue: 'amber',
      options: [
        { label: 'Amber', value: 'amber' },
        { label: 'Black & White', value: 'blackwhite' },
        { label: 'Sepia', value: 'sepia' },
        { label: 'Purple', value: 'purple' },
      ],
    },
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'caption',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Page sections',
      admin: {
        initCollapsed: true,
        description: 'Headings, visibility and counts for the sections on this series page. Leave a heading blank to use the default.',
      },
      fields: [
        {
          name: 'upcomingHeading',
          type: 'text',
          localized: true,
          admin: {
            description: 'Heading for the upcoming-events band (events derive from the Events collection)',
            placeholder: 'Nadchodzące wydarzenia w cyklu',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'upcomingCount',
              type: 'number',
              defaultValue: 6,
              min: 1,
              max: 12,
              admin: { width: '50%', description: 'How many upcoming events to list' },
            },
            {
              name: 'seeProgrammeLabel',
              type: 'text',
              localized: true,
              admin: { width: '50%', placeholder: 'Zobacz program' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'showOtherSeries',
              type: 'checkbox',
              defaultValue: true,
              admin: { width: '50%', description: 'Show the "other recurring series" section' },
            },
            {
              name: 'otherSeriesHeading',
              type: 'text',
              localized: true,
              admin: { width: '50%', placeholder: 'Pozostałe wydarzenia cykliczne' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'showNews',
              type: 'checkbox',
              defaultValue: true,
              admin: { width: '50%', description: 'Show the "news" (Aktualności) section' },
            },
            {
              name: 'newsHeading',
              type: 'text',
              localized: true,
              admin: { width: '50%', placeholder: 'Aktualności' },
            },
          ],
        },
      ],
    },
  ],
}
