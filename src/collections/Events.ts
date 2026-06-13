import type { CollectionConfig, Validate } from 'payload'
import { slugField } from 'payload'
import { revalidateTag } from 'next/cache'
import { warsawDayKey, warsawParts } from '@/lib/recurring-events'

// Only one event may exist per calendar day (Europe/Warsaw). We query a generous
// ±36h window around the chosen instant (covers the tz offset) and then compare
// the Warsaw day key, excluding the document being edited.
const validateOneEventPerDay: Validate<unknown, unknown, unknown, object> = async (
  value,
  { req, id },
) => {
  if (!value) return true
  try {
    const iso = value as string
    const targetKey = warsawDayKey(iso)
    const t = new Date(iso).getTime()
    const windowStart = new Date(t - 36 * 60 * 60 * 1000).toISOString()
    const windowEnd = new Date(t + 36 * 60 * 60 * 1000).toISOString()
    const and: Record<string, unknown>[] = [
      { date: { greater_than_equal: windowStart } },
      { date: { less_than_equal: windowEnd } },
    ]
    if (id) and.push({ id: { not_equals: id } })
    const { docs } = await req.payload.find({
      collection: 'events',
      where: { and },
      limit: 50,
      depth: 0,
      req,
    })
    const clash = docs.find((d) => d.date && warsawDayKey(d.date as string) === targetKey)
    if (clash) {
      const title = (clash as { title?: string | null }).title || 'bez tytułu'
      return `W tym dniu jest już zaplanowane inne wydarzenie („${title}”). W jednym dniu może odbyć się tylko jedno wydarzenie — wybierz inną datę.`
    }
    return true
  } catch {
    // Never block a save on a query failure.
    return true
  }
}

// The club is closed on Mondays — no event may ever be scheduled on a Monday
// (Europe/Warsaw). Checked before the one-per-day rule.
const validateEventDate: Validate<unknown, unknown, unknown, object> = async (value, options) => {
  if (!value) return true
  try {
    if (warsawParts(new Date(value as string)).weekday === 1) {
      return 'W poniedziałki klub jest zamknięty — nie można zaplanować wydarzenia w poniedziałek. Wybierz inny dzień tygodnia.'
    }
  } catch {
    // Never block a save on a parse failure.
  }
  return validateOneEventPerDay(value, options)
}

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'eventType', 'featured'],
    description:
      'Every event is a single, individually-created entry with one concrete date & time. ' +
      'Only one event is allowed per calendar day (Europe/Warsaw), and events cannot be scheduled on Mondays (the club is closed). ' +
      'To set up a similar event (e.g. another night in a series), open an existing one and use ' +
      'the “Duplicate” action, then change the date and details.',
    // Payload's row/document "Duplicate" action is enabled by default — left on
    // so editors can clone an existing event as a starting point (spec §3).
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    // ── Basic info (always visible) ──────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: { placeholder: 'Chicago – Szalone Lata Dwudzieste' },
    },
    // SEO audit: events are addressed by slug (/events/[slug]/) instead of the
    // numeric id. Auto-generated from the title, editable.
    slugField(),
    {
      type: 'row',
      fields: [
        {
          name: 'eventType',
          type: 'select',
          defaultValue: 'standard',
          options: [
            { label: 'Standard', value: 'standard' },
            { label: 'Special (WYDARZENIE SPECJALNE)', value: 'special' },
          ],
          admin: { width: '50%', description: 'Controls badge/styling on the program + detail pages' },
        },
        {
          name: 'leadTitle',
          type: 'text',
          localized: true,
          admin: { width: '50%', description: 'Eyebrow above the title (e.g. "Muzyka na żywo", "Recital")' },
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: { description: 'Short description shown on event cards and the calendar popover' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: { width: '50%', description: 'Photo shown as card background' },
        },
        {
          name: 'posterImage',
          type: 'upload',
          relationTo: 'media',
          admin: { width: '50%', description: 'Poster artwork (used in the special-events carousel)' },
        },
      ],
    },

    // ── Grouped tabs (When / Details / Lineup / Page content / Links) ────────
    {
      type: 'tabs',
      tabs: [
        {
          label: 'When',
          description: 'Date & time of this single event.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'date',
                  type: 'date',
                  validate: validateEventDate,
                  admin: {
                    width: '50%',
                    description:
                      'Start date and time of the event (Europe/Warsaw). Only one event per day is allowed, and Mondays are not allowed (the club is closed on Mondays).',
                    date: {
                      pickerAppearance: 'dayAndTime',
                      displayFormat: 'dd/MM/yyyy HH:mm',
                    },
                  },
                },
                {
                  name: 'endTime',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'End time in HH:MM format',
                    placeholder: '23:00',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Details',
          description: 'Pricing, prominence, room and series.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'price',
                  type: 'number',
                  admin: {
                    width: '50%',
                    description: 'Ticket price in PLN (leave empty if free)',
                    step: 5,
                  },
                },
                {
                  name: 'featured',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    width: '50%',
                    description: 'Make this event available for manual teaser selection',
                  },
                },
              ],
            },
            {
              name: 'showOnHomepage',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Show this event in the homepage "Nadchodzące wydarzenia" section. ' +
                  'Ticked by default — untick to hide just this event there. ' +
                  'Events drop off the section automatically once their date has passed.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'room',
                  type: 'relationship',
                  relationTo: 'rooms',
                  admin: { width: '50%', description: 'Which room/strefa' },
                },
                {
                  name: 'recurringSeries',
                  type: 'relationship',
                  relationTo: 'recurring-series',
                  admin: {
                    width: '50%',
                    description:
                      'Themed series this event belongs to (e.g. Jazzowe Wtorki). The series page lists every event linked here.',
                  },
                },
              ],
            },
            {
              name: 'genres',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              admin: { description: 'Genre/category chips (JAZZ, SWING, MUZYKA KLASYCZNA…)' },
            },
          ],
        },
        {
          label: 'Lineup',
          description: 'Musicians performing at this event.',
          fields: [
            {
              name: 'performers',
              type: 'array',
              labels: { singular: 'Performer', plural: 'Performers' },
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'musician', type: 'relationship', relationTo: 'musicians', admin: { width: '50%' } },
                    { name: 'instrument', type: 'text', localized: true, admin: { width: '50%', placeholder: 'saksofon' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Page content',
          description: 'Long-form content for the event detail page.',
          fields: [
            {
              name: 'descriptionHeading',
              type: 'text',
              localized: true,
              admin: { description: 'Heading above the long description on the event detail page' },
            },
            {
              name: 'body',
              type: 'richText',
              localized: true,
              admin: { description: 'Full description shown on the event detail page' },
            },
          ],
        },
        {
          label: 'Links',
          description: 'Ticketing, reservations and sharing.',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'ticketUrl',
                  type: 'text',
                  admin: { width: '50%', description: 'External URL to buy tickets', placeholder: 'https://...' },
                },
                {
                  name: 'reservationUrl',
                  type: 'text',
                  admin: { width: '50%', description: 'Overrides the global reservation link', placeholder: 'https://...' },
                },
              ],
            },
            {
              name: 'shareEnabled',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Show social share buttons on the event detail page' },
            },
          ],
        },
        {
          label: 'Detail page',
          description: 'Headings and visibility for the derived sections on this event’s detail page.',
          fields: [
            {
              name: 'performersHeading',
              type: 'text',
              localized: true,
              admin: { description: 'Heading above the performers grid', placeholder: 'Wykonawcy' },
            },
            {
              name: 'shareLabel',
              type: 'text',
              localized: true,
              admin: {
                description: 'Label above the share buttons (visibility is controlled by “Show social share buttons”)',
                placeholder: 'Udostępnij to wydarzenie',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'showUpcoming',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '50%', description: 'Show the "Nadchodzące wydarzenia" strip at the bottom' },
                },
                {
                  name: 'upcomingHeading',
                  type: 'text',
                  localized: true,
                  admin: { width: '50%', placeholder: 'Nadchodzące wydarzenia' },
                },
              ],
            },
          ],
        },
        {
          label: 'Rezerwacje',
          description:
            'Włącz i skonfiguruj rezerwacje stolików oraz biletów dla tego wydarzenia. ' +
            'Każdy otwarty wieczór = osobny wpis w Events; wieczór bez koncertu ma wyłączoną sekcję „Koncert”.',
          fields: [
            {
              name: 'reservationsEnabled',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Włącz rezerwacje online dla tego wydarzenia.' },
            },
            {
              name: 'capacity',
              type: 'number',
              min: 0,
              admin: {
                condition: (data) => Boolean(data.reservationsEnabled),
                description:
                  'Pojemność w osobach. Zostaw puste, aby użyć domyślnej z „Reservation Settings”; ' +
                  'wpisz wartość, aby nadpisać dla tego wydarzenia. Limit jest MIĘKKI — online nie blokuje, przekroczenie widać w CMS.',
              },
            },
            {
              name: 'optionOpening',
              type: 'group',
              label: 'Otwarcie wieczoru (darmowy stolik)',
              admin: {
                condition: (data) => Boolean(data.reservationsEnabled),
                description:
                  'Darmowy stolik od otwarcia do startu koncertu. Godziny podpowiadane z „Opening Hours” — nadpisywalne.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'enabled', type: 'checkbox', defaultValue: false, admin: { width: '34%' } },
                    { name: 'startTime', type: 'text', admin: { width: '33%', placeholder: '17:00' } },
                    { name: 'endTime', type: 'text', admin: { width: '33%', placeholder: '19:00' } },
                  ],
                },
              ],
            },
            {
              name: 'optionConcert',
              type: 'group',
              label: 'Koncert i wydarzenia muzyczne (bilet)',
              admin: {
                condition: (data) => Boolean(data.reservationsEnabled),
                description:
                  'Płatny bilet — obejmuje wcześniejsze przyjście (np. kolacja przed) oraz sam koncert.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'enabled', type: 'checkbox', defaultValue: false, admin: { width: '34%' } },
                    { name: 'startTime', type: 'text', admin: { width: '33%', placeholder: '16:00' } },
                    { name: 'endTime', type: 'text', admin: { width: '33%', placeholder: '22:00' } },
                  ],
                },
                {
                  name: 'pricePerPerson',
                  type: 'number',
                  min: 0,
                  admin: { step: 5, description: 'Cena biletu za osobę (PLN).' },
                },
              ],
            },
            {
              name: 'optionClub',
              type: 'group',
              label: 'Wieczór klubowy (darmowy stolik)',
              admin: {
                condition: (data) => Boolean(data.reservationsEnabled),
                description:
                  'Darmowy stolik od końca koncertu do zamknięcia. Godziny podpowiadane z „Opening Hours” — nadpisywalne.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'enabled', type: 'checkbox', defaultValue: false, admin: { width: '34%' } },
                    { name: 'startTime', type: 'text', admin: { width: '33%', placeholder: '22:00' } },
                    { name: 'endTime', type: 'text', admin: { width: '33%', placeholder: '24:00' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('events', 'max')
        } catch {
          // Outside Next.js context
        }
      },
    ],
    afterDelete: [
      () => {
        try {
          revalidateTag('events', 'max')
        } catch {}
      },
    ],
  },
}
