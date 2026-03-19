import type { Block } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Archive: Block = {
  slug: 'archive',
  labels: {
    singular: 'Archive',
    plural: 'Archives',
  },
  fields: [
    {
      name: 'introContent',
      type: 'richText',
      editor: lexicalEditor(),
      localized: true,
    },
    {
      name: 'populateBy',
      type: 'select',
      defaultValue: 'collection',
      options: [
        { label: 'Collection', value: 'collection' },
        { label: 'Individual Selection', value: 'selection' },
      ],
    },
    {
      name: 'relationTo',
      type: 'select',
      defaultValue: 'posts',
      label: 'Collections To Show',
      options: [
        { label: 'Posts', value: 'posts' },
        { label: 'Pages', value: 'pages' },
      ],
      admin: {
        condition: (_, { populateBy }) => populateBy === 'collection',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        condition: (_, { populateBy }) => populateBy === 'collection',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 10,
      admin: {
        condition: (_, { populateBy }) => populateBy === 'collection',
        step: 1,
      },
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      relationTo: ['pages', 'posts'],
      hasMany: true,
      admin: {
        condition: (_, { populateBy }) => populateBy === 'selection',
      },
    },
  ],
}
