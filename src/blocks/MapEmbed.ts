import type { Block } from 'payload'

export const MapEmbed: Block = {
  slug: 'mapEmbed',
  interfaceName: 'MapEmbedBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'embedUrl',
      type: 'text',
      admin: {
        description: 'Google Maps iframe src URL',
      },
    },
    {
      name: 'height',
      type: 'number',
      defaultValue: 400,
    },
  ],
}
