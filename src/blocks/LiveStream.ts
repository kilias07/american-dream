import type { Block } from 'payload'

export const LiveStream: Block = {
  slug: 'liveStream',
  labels: {
    singular: 'Live Stream',
    plural: 'Live Streams',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'embedUrl',
      type: 'text',
      required: true,
      label: 'Embed URL',
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
  ],
}
