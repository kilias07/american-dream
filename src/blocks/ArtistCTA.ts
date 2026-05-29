import type { Block } from 'payload'

export const ArtistCTA: Block = {
  slug: 'artistCTA',
  interfaceName: 'ArtistCtaBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'Jesteś muzykiem? Zapraszamy do współpracy!',
      },
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'KONTAKT DLA ARTYSTÓW',
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'DOWIEDZ SIĘ WIĘCEJ',
      },
    },
    {
      name: 'ctaUrl',
      type: 'text',
    },
  ],
}
