import type { Block } from 'payload'

export const ContactInfo: Block = {
  slug: 'contactInfo',
  interfaceName: 'ContactInfoBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'showForm',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'formHeading',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'SKONTAKTUJ SIĘ Z NAMI',
      },
    },
    {
      name: 'showMap',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
}
