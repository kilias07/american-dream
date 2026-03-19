import type { Block, Field } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { link } from '../fields/link'

const columnFields: Field[] = [
  {
    name: 'size',
    type: 'select',
    defaultValue: 'oneThird',
    options: [
      { label: 'One Third', value: 'oneThird' },
      { label: 'Half', value: 'half' },
      { label: 'Two Thirds', value: 'twoThirds' },
      { label: 'Full', value: 'full' },
    ],
  },
  {
    name: 'richText',
    type: 'richText',
    editor: lexicalEditor(),
    label: false,
  },
  {
    name: 'enableLink',
    type: 'checkbox',
  },
  {
    ...link({ appearances: false }),
    admin: {
      condition: (_, { enableLink }) => Boolean(enableLink),
    },
  },
]

export const Content: Block = {
  slug: 'content',
  labels: {
    singular: 'Content',
    plural: 'Content Blocks',
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      fields: columnFields,
    },
  ],
}
