import type { Block } from 'payload'

export const MusiciansGrid: Block = {
  slug: 'musiciansGrid',
  interfaceName: 'MusiciansGridBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'NASI MUZYCY',
      },
    },
    {
      name: 'musicians',
      type: 'relationship',
      relationTo: 'musicians',
      hasMany: true,
      admin: {
        description: 'Optional — leave empty to show all by order',
      },
    },
  ],
}
