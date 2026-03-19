import type { Field, GroupField } from 'payload'

type Appearances = 'default' | 'outline'

type LinkOptions = {
  appearances?: false | Appearances[]
}

export const link = ({ appearances }: LinkOptions = {}): GroupField => {
  const appearanceOptions = appearances !== undefined ? appearances : (['default', 'outline'] as Appearances[])

  const fields: Field[] = [
    {
      name: 'type',
      type: 'radio',
      admin: {
        layout: 'horizontal',
      },
      defaultValue: 'reference',
      options: [
        { label: 'Internal link', value: 'reference' },
        { label: 'Custom URL', value: 'custom' },
      ],
    },
    {
      name: 'newTab',
      type: 'checkbox',
      admin: {
        width: '50%',
      },
      label: 'Open in new tab',
    },
    {
      name: 'reference',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'reference',
      },
      label: 'Document to link to',
      relationTo: ['pages', 'posts'],
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'custom',
      },
      label: 'Custom URL',
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      label: 'Label',
      required: true,
    },
  ]

  if (appearanceOptions !== false) {
    fields.push({
      name: 'appearance',
      type: 'select',
      admin: {
        description: 'Choose how the link should be rendered.',
      },
      defaultValue: 'default',
      label: 'Appearance',
      options: appearanceOptions.map((option) => ({
        label: option.charAt(0).toUpperCase() + option.slice(1),
        value: option,
      })),
    })
  }

  return {
    name: 'link',
    type: 'group',
    fields,
  }
}
