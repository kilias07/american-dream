import type { Block } from 'payload'

export const ArtistForm: Block = {
  slug: 'artistForm',
  interfaceName: 'ArtistFormBlock',
  admin: { group: 'Content' },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
  ],
}
