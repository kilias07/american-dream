import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

/**
 * Site-wide interface microcopy (buttons, form labels, status messages, weekday
 * names, menu legend) so every small piece of UI text is editable in the CMS —
 * not hardcoded in components. All fields are localized (PL/EN). Components keep
 * their original string as a fallback, so an empty field never breaks the UI.
 */
const text = (name: string): { name: string; type: 'text'; localized: true } => ({
  name,
  type: 'text',
  localized: true,
})

export const UILabels: GlobalConfig = {
  slug: 'ui-labels',
  label: 'Teksty interfejsu (UI)',
  admin: { group: 'Settings' },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Wspólne',
      fields: [
        {
          name: 'common',
          type: 'group',
          fields: [
            text('readMore'), // Czytaj więcej
            text('openingHours'), // Godziny otwarcia
            text('closed'), // Zamknięte
            text('newsletter'), // Newsletter
            text('noNews'), // Brak aktualności.
            text('writeToUs'), // Napisz do nas
            text('callUs'), // Zadzwoń do nas
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Dni tygodnia',
      fields: [
        {
          name: 'days',
          type: 'group',
          fields: [
            text('monday'),
            text('tuesday'),
            text('wednesday'),
            text('thursday'),
            text('friday'),
            text('saturday'),
            text('sunday'),
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Formularze',
      fields: [
        {
          name: 'forms',
          type: 'group',
          label: 'Formularz kontaktowy',
          admin: {
            description:
              'Pola, podpowiedzi (placeholdery) i komunikaty formularza kontaktowego na stronie Kontakt. Puste pole = tekst domyślny.',
          },
          fields: [
            { ...text('name'), label: 'Podpowiedź pola „Imię"' },
            { ...text('phone'), label: 'Podpowiedź pola „Telefon"' },
            { ...text('email'), label: 'Podpowiedź pola „Adres email"' },
            { ...text('message'), label: 'Podpowiedź pola „Wiadomość" (treść wiadomości)' },
            { ...text('consent'), label: 'Zgoda (checkbox) — np. „Akceptuję politykę prywatności"' },
            { ...text('submit'), label: 'Przycisk wysyłki — np. „Wyślij wiadomość"' },
            { ...text('sending'), label: 'Komunikat w trakcie wysyłki — np. „Wysyłanie…"' },
            { ...text('success'), label: 'Komunikat po sukcesie' },
            { ...text('error'), label: 'Komunikat błędu' },
            { ...text('contactHeading'), label: 'Nagłówek formularza — np. „SKONTAKTUJ SIĘ Z NAMI"' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Menu',
      fields: [
        {
          name: 'menu',
          type: 'group',
          fields: [
            text('fullMenuPdf'), // Zobacz całe menu (PDF)
            text('legendPair'), // danie dla dwóch osób
            text('legendVeg'), // danie wegetariańskie
            text('legendVegan'), // danie wegańskie
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Wydarzenia',
      fields: [
        {
          name: 'event',
          type: 'group',
          fields: [
            text('reserveTable'), // Zarezerwuj stolik
            text('specialEvent'), // Wydarzenie specjalne
          ],
        },
      ],
    },
    {
      // Popup 18+ (uwaga klienta 2026-07, Cigar Room) — teksty edytowalne.
      type: 'collapsible',
      label: 'Bramka wiekowa (18+)',
      fields: [
        {
          name: 'ageGate',
          type: 'group',
          fields: [
            text('title'), // Strona tylko dla użytkowników 18+
            text('body'), // Czy jesteś pełnoletni/-a?
            text('confirmLabel'), // JESTEM PEŁNOLETNI — TAK
            text('declineLabel'), // NIE
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_ui_labels', 'max')
        } catch {
          // Outside Next.js context
        }
      },
    ],
  },
}
