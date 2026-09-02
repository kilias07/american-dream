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
      name: 'intro',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Lead paragraph shown above the musicians grid.',
      },
    },
    {
      name: 'musicians',
      type: 'relationship',
      relationTo: 'musicians',
      hasMany: true,
      admin: {
        description:
          'ZOSTAW PUSTE, żeby pokazać wszystkich muzyków. Wybranie choćby jednego '
          + 'ogranicza sekcję WYŁĄCZNIE do wybranych — reszta znika ze strony.',
      },
    },
  ],
}
