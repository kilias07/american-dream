import type { Block } from 'payload'

export const SalesContact: Block = {
  slug: 'salesContact',
  interfaceName: 'SalesContactBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'POROZMAWIAJMY O TWOIM WYDARZENIU',
      },
    },
    {
      name: 'teamMember',
      type: 'relationship',
      relationTo: 'team-members',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'callLabel',
          type: 'text',
          localized: true,
          defaultValue: 'ZADZWOŃ',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'emailLabel',
          type: 'text',
          localized: true,
          defaultValue: 'ZAPYTAJ MAILOWO',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'gold',
      options: [
        { label: 'Gold', value: 'gold' },
        { label: 'Navy', value: 'navy' },
      ],
    },
  ],
}
