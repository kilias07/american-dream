import type { CollectionConfig } from 'payload'

/**
 * Everything a visitor leaves their address for: the newsletter, a "notify me"
 * on a recurring series, and messages from the contact form.
 *
 * It exists because none of those were being kept. `/api/contact` wrote the
 * submission to the worker log and returned success — so unless somebody
 * happened to be tailing the logs at that moment, the enquiry was gone. Storing
 * them in the CMS means the club can actually read and answer them, and gives
 * the "notify me" list somewhere to live until the mail sender is configured.
 */
export const Signups: CollectionConfig = {
  slug: 'signups',
  labels: { singular: 'Zapis / wiadomość', plural: 'Zapisy i wiadomości' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'kind', 'series', 'createdAt', 'handled'],
    description:
      'Zapisy na newsletter, powiadomienia o wydarzeniach cyklicznych i wiadomości z formularza kontaktowego.',
    group: 'Formularze',
  },
  access: {
    // The public forms post here; reading stays behind the admin login because
    // these are personal data.
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'kind',
      type: 'select',
      required: true,
      defaultValue: 'newsletter',
      options: [
        { label: 'Newsletter', value: 'newsletter' },
        { label: 'Powiadom o wydarzeniu', value: 'event' },
        { label: 'Wiadomość z formularza', value: 'contact' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', admin: { width: '50%' } },
        { name: 'phone', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      admin: { condition: (data) => data?.kind === 'contact' },
    },
    {
      name: 'series',
      type: 'relationship',
      relationTo: 'recurring-series',
      label: 'Cykl wydarzeń',
      admin: {
        condition: (data) => data?.kind === 'event',
        description: 'Cykl, o którego kolejnych terminach gość chce wiedzieć.',
      },
    },
    {
      name: 'locale',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Język strony, z której przyszedł zapis.',
      },
    },
    {
      name: 'handled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Obsłużone',
      admin: { position: 'sidebar', description: 'Odhacz, gdy wiadomość została załatwiona.' },
    },
    {
      name: 'notifiedAt',
      type: 'date',
      label: 'Ostatnie powiadomienie',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => data?.kind === 'event',
        description: 'Wypełni się, gdy wysyłka e-maili zostanie skonfigurowana.',
      },
    },
  ],
  timestamps: true,
}
