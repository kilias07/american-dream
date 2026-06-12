import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

// Bilingual default for a localized text field. `defaultValue` receives the
// locale being written, so both the PL and EN slots start pre-filled (the site
// default locale is `en`, so we can't rely on a single literal).
const bilingual =
  (pl: string, en: string) =>
  ({ locale }: { locale?: string }) =>
    locale === 'pl' ? pl : en

export const ReservationSettings: GlobalConfig = {
  slug: 'reservation-settings',
  admin: { group: 'Rezerwacje' },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'defaultCapacity',
          type: 'number',
          min: 0,
          defaultValue: 60,
          admin: {
            width: '50%',
            description:
              'Domyślna pojemność w osobach. Używana, gdy wydarzenie nie ma własnej pojemności. Limit MIĘKKI.',
          },
        },
        {
          name: 'notificationEmail',
          type: 'text',
          defaultValue: 'rezerwacja@americandreamclub.pl',
          admin: {
            width: '50%',
            description: 'Odbiorca powiadomień o nowych rezerwacjach (obsługa).',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'contactEmail',
          type: 'text',
          defaultValue: 'rezerwacja@americandreamclub.pl',
          admin: {
            width: '50%',
            description: 'E-mail kontaktowy podawany klientom (np. przy anulacji).',
          },
        },
        {
          name: 'contactPhone',
          type: 'text',
          defaultValue: '+48 500 210 333',
          admin: {
            width: '50%',
            description: 'Telefon kontaktowy podawany klientom (np. przy anulacji).',
          },
        },
      ],
    },
    {
      name: 'texts',
      type: 'group',
      label: 'Teksty popupu i ekranów statusu (PL/EN)',
      admin: {
        description:
          'Dwujęzyczne teksty pokazywane w kreatorze rezerwacji i na ekranach statusu. ' +
          'Przełącz locale (PL/EN) w prawym górnym rogu, aby edytować drugą wersję.',
      },
      fields: [
        {
          name: 'openingInfo',
          type: 'textarea',
          localized: true,
          admin: { description: 'Opis opcji „Otwarcie wieczoru” (semantyka czasu).' },
          defaultValue: bilingual(
            'Darmowy stolik od otwarcia klubu do startu koncertu. Rezerwacja nie obejmuje koncertu i kończy się z jego rozpoczęciem.',
            'A free table from opening until the concert starts. This reservation does not include the concert and ends when it begins.',
          ),
        },
        {
          name: 'concertInfo',
          type: 'textarea',
          localized: true,
          admin: { description: 'Opis opcji „Koncert” (semantyka czasu).' },
          defaultValue: bilingual(
            'Płatny bilet na koncert. Obejmuje wcześniejsze przyjście (np. kolacja przed) oraz cały koncert.',
            'A paid concert ticket. It includes early arrival (e.g. dinner beforehand) and the full concert.',
          ),
        },
        {
          name: 'clubInfo',
          type: 'textarea',
          localized: true,
          admin: { description: 'Opis opcji „Wieczór klubowy” (semantyka czasu).' },
          defaultValue: bilingual(
            'Darmowy stolik od zakończenia koncertu do zamknięcia klubu.',
            'A free table from the end of the concert until closing time.',
          ),
        },
        {
          name: 'freePendingMessage',
          type: 'textarea',
          localized: true,
          admin: { description: 'Ekran po wysłaniu darmowej rezerwacji (oczekuje na zatwierdzenie).' },
          defaultValue: bilingual(
            'Dziękujemy! Twoja rezerwacja oczekuje na zatwierdzenie obsługi. Potwierdzenie wyślemy SMS-em i e-mailem.',
            'Thank you! Your reservation is awaiting staff approval. We will confirm by SMS and email.',
          ),
        },
        {
          name: 'paidAcceptedMessage',
          type: 'textarea',
          localized: true,
          admin: { description: 'Ekran po opłaceniu (czeka na potwierdzenie obsługi).' },
          defaultValue: bilingual(
            'Płatność przyjęta, czekamy na potwierdzenie obsługi. W razie odrzucenia zwrócimy środki.',
            'Payment received, awaiting staff confirmation. If it is rejected, we will refund you.',
          ),
        },
        {
          name: 'closeWarning',
          type: 'text',
          localized: true,
          admin: { description: 'Ostrzeżenie przy zamykaniu popupu po wpisaniu danych.' },
          defaultValue: bilingual(
            'Na pewno chcesz zamknąć? Utracisz wprowadzone dane.',
            'Are you sure you want to close? You will lose your progress.',
          ),
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_reservation_settings', 'max')
        } catch {
          // Outside Next.js context
        }
      },
    ],
  },
}
