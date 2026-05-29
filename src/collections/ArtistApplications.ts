import type { CollectionConfig } from 'payload'

export const ArtistApplications: CollectionConfig = {
  slug: 'artist-applications',
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'instrument', 'status', 'createdAt'],
    description: 'Submissions from the public artist contact form.',
  },
  access: {
    // Public can submit applications via the front-end form
    create: () => true,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contact',
          fields: [
            {
              name: 'fullName',
              type: 'text',
              required: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'phone',
                  type: 'text',
                  admin: { width: '50%' },
                },
                {
                  name: 'email',
                  type: 'email',
                  required: true,
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'city',
              type: 'text',
            },
          ],
        },
        {
          label: 'Musical profile',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'instrument',
                  type: 'text',
                  admin: { width: '50%' },
                },
                {
                  name: 'genres',
                  type: 'text',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'preferredLineup',
              type: 'select',
              options: [
                { label: 'Solo', value: 'solo' },
                { label: 'Duo', value: 'duo' },
                { label: 'Trio', value: 'trio' },
                { label: 'Quartet', value: 'quartet' },
                { label: 'Band', value: 'band' },
                { label: 'Other', value: 'other' },
              ],
            },
            {
              name: 'bandName',
              type: 'text',
            },
            {
              name: 'rateProposal',
              type: 'text',
            },
            {
              name: 'dateProposals',
              type: 'textarea',
            },
            {
              name: 'repertoire',
              type: 'textarea',
            },
          ],
        },
        {
          label: 'Education & experience',
          fields: [
            {
              name: 'musicEducation',
              type: 'select',
              options: [
                { label: 'None', value: 'none' },
                { label: 'In progress', value: 'inProgress' },
                { label: 'Secondary', value: 'secondary' },
                { label: 'Higher', value: 'higher' },
              ],
            },
            {
              name: 'schoolName',
              type: 'text',
            },
            {
              name: 'educationDetails',
              type: 'textarea',
            },
            {
              name: 'stageExperience',
              type: 'select',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Some', value: 'some' },
                { label: 'Experienced', value: 'experienced' },
                { label: 'Professional', value: 'professional' },
              ],
            },
            {
              name: 'pastVenues',
              type: 'textarea',
            },
          ],
        },
        {
          label: 'Recordings & social',
          fields: [
            {
              name: 'recordings',
              type: 'array',
              fields: [
                {
                  name: 'url',
                  type: 'text',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'facebook',
                  type: 'text',
                  admin: { width: '50%' },
                },
                {
                  name: 'instagram',
                  type: 'text',
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
        {
          label: 'Message',
          fields: [
            {
              name: 'message',
              type: 'textarea',
            },
          ],
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Reviewed', value: 'reviewed' },
        { label: 'Contacted', value: 'contacted' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
