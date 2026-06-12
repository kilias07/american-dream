import type { Locale } from '@/config/locales'

// Bilingual UI strings for the reservation wizard (spec §3 — popup must be fully
// PL/EN). Option time-semantics copy (§1) lives here as a sensible default; the
// CMS `reservation-settings.texts` can override the option descriptions shown.

export type ReservationDict = {
  title: string
  step: (n: number, total: number) => string
  options: {
    heading: string
    opening: { label: string; info: string }
    concert: { label: string; info: string }
    club: { label: string; info: string }
  }
  pickEvent: { heading: string; empty: string; concertOnlyNote: string }
  slot: { heading: string; window: string; guests: string }
  details: {
    heading: string
    firstName: string
    lastName: string
    phone: string
    email: string
    consentTerms: string
    consentNewsletter: string
  }
  summary: {
    heading: string
    option: string
    date: string
    time: string
    guests: string
    price: string
    free: string
    perPerson: string
  }
  buttons: {
    back: string
    next: string
    submitFree: string
    submitPaid: string
    close: string
    done: string
  }
  validation: { required: string; email: string; consent: string }
  submitting: string
  successFree: { heading: string; body: string }
  errorGeneric: string
  closeConfirm: { heading: string; body: string; stay: string; leave: string }
}

const pl: ReservationDict = {
  title: 'Rezerwacja',
  step: (n, total) => `Krok ${n} z ${total}`,
  options: {
    heading: 'Wybierz rodzaj rezerwacji',
    opening: {
      label: 'Otwarcie wieczoru',
      info: 'Darmowy stolik od otwarcia klubu do startu koncertu. Nie obejmuje koncertu.',
    },
    concert: {
      label: 'Koncert',
      info: 'Płatny bilet. Obejmuje wcześniejsze przyjście (np. kolacja przed) oraz cały koncert.',
    },
    club: {
      label: 'Wieczór klubowy',
      info: 'Darmowy stolik od zakończenia koncertu do zamknięcia klubu.',
    },
  },
  pickEvent: {
    heading: 'Wybierz wydarzenie',
    empty: 'Brak dostępnych terminów dla tej opcji.',
    concertOnlyNote: 'Pokazujemy tylko wieczory z koncertem.',
  },
  slot: { heading: 'Termin i liczba osób', window: 'Godziny', guests: 'Liczba osób' },
  details: {
    heading: 'Twoje dane',
    firstName: 'Imię',
    lastName: 'Nazwisko',
    phone: 'Telefon',
    email: 'E-mail',
    consentTerms: 'Akceptuję regulamin i przetwarzanie danych do realizacji rezerwacji.',
    consentNewsletter: 'Chcę otrzymywać newsletter American Dream Club.',
  },
  summary: {
    heading: 'Podsumowanie',
    option: 'Rodzaj',
    date: 'Data',
    time: 'Godziny',
    guests: 'Liczba osób',
    price: 'Do zapłaty',
    free: 'Bezpłatna',
    perPerson: 'za osobę',
  },
  buttons: {
    back: 'Wstecz',
    next: 'Dalej',
    submitFree: 'Wyślij rezerwację',
    submitPaid: 'Zapłać i zarezerwuj',
    close: 'Zamknij',
    done: 'Gotowe',
  },
  validation: {
    required: 'To pole jest wymagane.',
    email: 'Podaj poprawny adres e-mail.',
    consent: 'Akceptacja regulaminu jest wymagana.',
  },
  submitting: 'Przetwarzanie…',
  successFree: {
    heading: 'Rezerwacja przyjęta',
    body: 'Twoja rezerwacja oczekuje na zatwierdzenie obsługi. Potwierdzenie wyślemy SMS-em i e-mailem.',
  },
  errorGeneric: 'Coś poszło nie tak. Spróbuj ponownie lub skontaktuj się z nami.',
  closeConfirm: {
    heading: 'Na pewno chcesz zamknąć?',
    body: 'Utracisz wprowadzone dane.',
    stay: 'Wróć',
    leave: 'Zamknij mimo to',
  },
}

const en: ReservationDict = {
  title: 'Reservation',
  step: (n, total) => `Step ${n} of ${total}`,
  options: {
    heading: 'Choose your reservation type',
    opening: {
      label: 'Evening opening',
      info: 'A free table from opening until the concert starts. Does not include the concert.',
    },
    concert: {
      label: 'Concert',
      info: 'A paid ticket. Includes early arrival (e.g. dinner beforehand) and the full concert.',
    },
    club: { label: 'Club night', info: 'A free table from the end of the concert until closing.' },
  },
  pickEvent: {
    heading: 'Choose an event',
    empty: 'No available dates for this option.',
    concertOnlyNote: 'Showing only evenings with a concert.',
  },
  slot: { heading: 'Date & guests', window: 'Hours', guests: 'Number of guests' },
  details: {
    heading: 'Your details',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    email: 'Email',
    consentTerms: 'I accept the terms and the processing of my data to fulfil the reservation.',
    consentNewsletter: 'I would like to receive the American Dream Club newsletter.',
  },
  summary: {
    heading: 'Summary',
    option: 'Type',
    date: 'Date',
    time: 'Hours',
    guests: 'Guests',
    price: 'To pay',
    free: 'Free',
    perPerson: 'per person',
  },
  buttons: {
    back: 'Back',
    next: 'Next',
    submitFree: 'Send reservation',
    submitPaid: 'Pay & reserve',
    close: 'Close',
    done: 'Done',
  },
  validation: {
    required: 'This field is required.',
    email: 'Enter a valid email address.',
    consent: 'Accepting the terms is required.',
  },
  submitting: 'Processing…',
  successFree: {
    heading: 'Reservation received',
    body: 'Your reservation is awaiting staff approval. We will confirm by SMS and email.',
  },
  errorGeneric: 'Something went wrong. Please try again or contact us.',
  closeConfirm: {
    heading: 'Close the form?',
    body: 'You will lose your progress.',
    stay: 'Go back',
    leave: 'Close anyway',
  },
}

export function getReservationDict(locale: Locale): ReservationDict {
  return locale === 'en' ? en : pl
}
