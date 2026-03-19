import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { linkGroup } from '../fields/linkGroup'

export const CallToAction: Block = {
  slug: 'cta',
  labels: {
    singular: 'Call to Action',
    plural: 'Calls to Action',
  },
  fields: [
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor(),
      localized: true,
    },
    linkGroup({ overrides: { maxRows: 2 } }),
  ],
}
