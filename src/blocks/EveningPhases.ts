import type { Block } from 'payload'

export const EveningPhases: Block = {
  slug: 'eveningPhases',
  interfaceName: 'EveningPhasesBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'ZAPLANUJ SWÓJ WIECZÓR',
      },
    },
    {
      name: 'phases',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'linkToCalendar',
          type: 'checkbox',
          defaultValue: false,
          label: 'Pokaż wydarzenie z kalendarza',
          admin: {
            description:
              'Gdy zaznaczone: ta karta pokazuje rzeczywiste wydarzenie z kalendarza dla wybranego dnia tygodnia (tytuł, godzina, zdjęcie, link do wydarzenia). Bez wydarzenia danego dnia — pokazuje treść poniżej.',
          },
        },
        {
          name: 'timeLabel',
          type: 'text',
          admin: {
            placeholder: 'od 17:00',
          },
        },
        {
          name: 'body',
          type: 'textarea',
          localized: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'primaryCtaLabel',
              type: 'text',
              localized: true,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'primaryCtaUrl',
              type: 'text',
              admin: {
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'secondaryCtaLabel',
              type: 'text',
              localized: true,
              admin: {
                width: '50%',
              },
            },
            {
              name: 'secondaryCtaUrl',
              type: 'text',
              admin: {
                width: '50%',
              },
            },
          ],
        },
      ],
    },
  ],
}
