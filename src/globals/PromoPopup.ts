import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

/**
 * Pop-up promocyjny na stronie głównej — narzędzie do ogłaszania akcji
 * promocyjnych i ważnych informacji. Celowo global, nie blok: klient ma go
 * włączać i wyłączać w jednym miejscu, bez wchodzenia w układ strony.
 *
 * Widoczność steruje się trzema niezależnymi warunkami (wszystkie muszą być
 * spełnione): checkbox `enabled`, opcjonalne okno dat oraz to, czy gość już go
 * nie zamknął. Dzięki oknu dat klient może przygotować promocję z wyprzedzeniem
 * i nie musi pamiętać, żeby ją wyłączyć po zakończeniu.
 */
export const PromoPopup: GlobalConfig = {
  slug: 'promo-popup',
  label: 'Pop-up promocyjny',
  access: { read: () => true },
  admin: {
    description:
      'Okno wyskakujące na stronie głównej. Aby je pokazać, zaznacz „Włączony" i zapisz. ' +
      'Treść ustawia się osobno dla każdego języka — sprawdź przełącznik języka w prawym górnym rogu.',
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Włączony',
      admin: {
        position: 'sidebar',
        description: 'Odznacz, aby ukryć pop-up bez kasowania jego treści.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          label: 'Pokazuj od',
          admin: {
            width: '50%',
            description: 'Zostaw puste, aby pokazywać od razu.',
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          label: 'Pokazuj do',
          admin: {
            width: '50%',
            description: 'Zostaw puste, aby pokazywać bez końca. Po tej dacie pop-up zniknie sam.',
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' },
          },
        },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Zdjęcie',
      admin: { description: 'Opcjonalne. Wyświetla się nad tekstem.' },
    },
    { name: 'eyebrow', type: 'text', localized: true, label: 'Nadtytuł', admin: { placeholder: 'Promocja' } },
    { name: 'heading', type: 'text', localized: true, label: 'Nagłówek', admin: { placeholder: 'Tydzień jazzowy' } },
    { name: 'body', type: 'textarea', localized: true, label: 'Treść' },
    {
      type: 'row',
      fields: [
        { name: 'ctaLabel', type: 'text', localized: true, label: 'Napis na przycisku', admin: { width: '50%', placeholder: 'ZOBACZ PROGRAM' } },
        { name: 'ctaUrl', type: 'text', label: 'Adres przycisku', admin: { width: '50%', placeholder: '/events' } },
      ],
    },
    {
      name: 'frequency',
      type: 'select',
      defaultValue: 'session',
      label: 'Jak często pokazywać',
      options: [
        { label: 'Raz na wizytę (do zamknięcia karty)', value: 'session' },
        { label: 'Raz dziennie', value: 'daily' },
        { label: 'Za każdym wejściem (uciążliwe — tylko do testów)', value: 'always' },
      ],
      admin: {
        description:
          'Po zamknięciu pop-up nie wraca przez wybrany czas. Zmiana treści pop-upu pokazuje go ponownie wszystkim.',
      },
    },
    {
      name: 'delaySeconds',
      type: 'number',
      defaultValue: 3,
      min: 0,
      max: 60,
      label: 'Opóźnienie (sekundy)',
      admin: {
        description: 'Ile sekund po wejściu ma się pojawić. Natychmiastowy pop-up bywa odbierany jako natrętny.',
      },
    },
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_promo_popup', 'max')
        } catch {
          // poza kontekstem Next (np. skrypt seed)
        }
      },
    ],
  },
}
