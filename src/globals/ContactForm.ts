import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'

/**
 * Formularz kontaktowy — WSZYSTKIE teksty formularza ze strony Kontakt w jednym,
 * łatwym do znalezienia miejscu (uwaga klienta 2026-07: „Formularz kontaktowy
 * nie jest widoczny na backendzie w sekcji Forms"). Global siedzi w grupie
 * admina „Formularze (Forms)". Puste pole = tekst domyślny (fallback w kodzie),
 * więc nic się nie psuje przy braku wartości.
 */
const text = (
  name: string,
  label: string,
  placeholder: string,
): { name: string; type: 'text'; localized: true; label: string; admin: { placeholder: string } } => ({
  name,
  type: 'text',
  localized: true,
  label,
  admin: { placeholder },
})

export const ContactForm: GlobalConfig = {
  slug: 'contact-form',
  label: 'Formularz kontaktowy',
  admin: {
    group: 'Formularze (Forms)',
    description:
      'Nagłówek, podpowiedzi pól (placeholdery) i komunikaty formularza na stronie Kontakt. Puste pole = tekst domyślny.',
  },
  access: {
    read: () => true,
  },
  fields: [
    text('heading', 'Nagłówek formularza', 'SKONTAKTUJ SIĘ Z NAMI'),
    {
      type: 'row',
      fields: [
        { ...text('name', 'Podpowiedź pola „Imię"', 'Imię'), admin: { placeholder: 'Imię', width: '50%' } },
        { ...text('phone', 'Podpowiedź pola „Telefon"', 'Telefon'), admin: { placeholder: 'Telefon', width: '50%' } },
      ],
    },
    text('email', 'Podpowiedź pola „Adres email"', 'Adres email'),
    text('message', 'Podpowiedź pola „Wiadomość" (treść wiadomości)', 'Wiadomość'),
    text('consent', 'Zgoda (checkbox)', 'Akceptuję politykę prywatności'),
    {
      type: 'row',
      fields: [
        { ...text('submit', 'Przycisk wysyłki', 'Wyślij wiadomość'), admin: { placeholder: 'Wyślij wiadomość', width: '50%' } },
        { ...text('sending', 'Komunikat w trakcie wysyłki', 'Wysyłanie…'), admin: { placeholder: 'Wysyłanie…', width: '50%' } },
      ],
    },
    text('success', 'Komunikat po sukcesie', 'Dziękujemy! Wiadomość została wysłana.'),
    text('error', 'Komunikat błędu', 'Wystąpił błąd. Spróbuj ponownie później.'),
  ],
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('global_contact_form', 'max')
          revalidateTag('page-contact', 'max')
        } catch {
          // poza kontekstem Next (np. CLI)
        }
      },
    ],
  },
}
