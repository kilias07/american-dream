import type { Block } from 'payload'

export const NewsletterCTA: Block = {
  slug: 'newsletterCTA',
  interfaceName: 'NewsletterCtaBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'NEWSLETTER',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'placeholder',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'Adres email',
      },
    },
    {
      name: 'buttonLabel',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'ZAPISZ SIĘ',
      },
    },
    {
      name: 'consentText',
      type: 'text',
      localized: true,
      admin: {
        placeholder: 'Akceptuję politykę prywatności',
      },
    },
  ],
}
