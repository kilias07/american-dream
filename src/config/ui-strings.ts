import type { Locale } from './locales'

/**
 * Teksty interfejsu zaszyte w kodzie — jedno miejsce na wszystkie języki.
 *
 * Wcześniej były rozsypane po ~26 plikach jako warunki `locale === 'pl' ? … : …`.
 * Taki zapis zakłada DOKŁADNIE dwa języki i przy trzecim nie wywala builda —
 * po prostu po cichu podaje Niemcowi czy Francuzowi wersję angielską. Słownik
 * typowany przez `Record<Locale, …>` sprawia, że kompilator wskazuje braki.
 *
 * To są WARTOŚCI DOMYŚLNE. Część tekstów klient może nadpisać w CMS
 * (global „Teksty interfejsu"); tutaj trzymamy to, co musi zadziałać nawet gdy
 * baza jest chwilowo niedostępna.
 */
export type UIStrings = {
  /** Tag BCP-47 do formatowania dat i liczb. */
  intl: string

  news: string
  newsUpper: string
  allNews: string
  noNews: string
  relatedNews: string
  readMore: string
  readMoreEllipsis: string
  back: string

  program: string
  calendarUpper: string
  seeFullProgram: string
  seeProgram: string
  upcomingEvents: string
  upcomingEventsUpper: string
  noUpcomingEvents: string
  upcomingInSeries: string
  otherSeries: string
  recurringEventsUpper: string
  recurring: string
  specialEventsUpper: string
  specialEvent: string
  shareEvent: string
  addToCalendar: string
  tickets: string
  details: string
  chooseDay: string
  showMoreDays: string
  previousWeeks: string
  nextWeeks: string
  previous: string
  next: string
  slide: string

  ourMusicians: string
  upcomingPerformances: string

  reserveTable: string
  bookNow: string
  seeFullMenuPdf: string
  openingHours: string
  closedUpper: string
  callUs: string
  writeToUs: string
  contactUsUpper: string
  map: string
  emailAddress: string
  acceptPrivacyPolicy: string
  signUpUpper: string
  upTo: string
  people: string
}

export const UI_STRINGS: Record<Locale, UIStrings> = {
  pl: {
    intl: 'pl-PL',
    news: 'Aktualności', newsUpper: 'AKTUALNOŚCI', allNews: 'Wszystkie aktualności',
    noNews: 'Brak aktualności.', relatedNews: 'Zobacz również',
    readMore: 'Czytaj więcej', readMoreEllipsis: 'Czytaj więcej…', back: 'Wróć',
    program: 'PROGRAM', calendarUpper: 'KALENDARZ',
    seeFullProgram: 'SPRAWDŹ PEŁEN PROGRAM', seeProgram: 'Zobacz program',
    upcomingEvents: 'Nadchodzące wydarzenia', upcomingEventsUpper: 'NADCHODZĄCE WYDARZENIA',
    noUpcomingEvents: 'Brak nadchodzących wydarzeń.',
    upcomingInSeries: 'Nadchodzące wydarzenia w cyklu', otherSeries: 'Pozostałe wydarzenia cykliczne',
    recurringEventsUpper: 'WYDARZENIA CYKLICZNE', recurring: 'Powtarzające się',
    specialEventsUpper: 'WYDARZENIA SPECJALNE', specialEvent: 'Wydarzenie specjalne',
    shareEvent: 'Udostępnij to wydarzenie', addToCalendar: 'Dodaj do kalendarza',
    tickets: 'Bilety', details: 'Szczegóły', chooseDay: 'Wybierz dzień',
    showMoreDays: 'Pokaż dalsze dni', previousWeeks: 'Poprzednie tygodnie', nextWeeks: 'Następne tygodnie',
    previous: 'Poprzednie', next: 'Następne', slide: 'Pozycja',
    ourMusicians: 'Nasi muzycy', upcomingPerformances: 'Najbliższe występy',
    reserveTable: 'Zarezerwuj stolik', bookNow: 'Zarezerwuj',
    seeFullMenuPdf: 'Zobacz całe menu (PDF)', openingHours: 'Godziny otwarcia', closedUpper: 'ZAMKNIĘTE',
    callUs: 'Zadzwoń do nas', writeToUs: 'Napisz do nas', contactUsUpper: 'SKONTAKTUJ SIĘ Z NAMI',
    map: 'Mapa', emailAddress: 'Adres email', acceptPrivacyPolicy: 'Akceptuję politykę prywatności',
    signUpUpper: 'ZAPISZ SIĘ', upTo: 'do', people: 'osób',
  },
  en: {
    intl: 'en-GB',
    news: 'News', newsUpper: 'NEWS', allNews: 'All news',
    noNews: 'No news yet.', relatedNews: 'Related news',
    readMore: 'Read more', readMoreEllipsis: 'Read more…', back: 'Back',
    program: 'PROGRAM', calendarUpper: 'CALENDAR',
    seeFullProgram: 'SEE THE FULL PROGRAM', seeProgram: 'See programme',
    upcomingEvents: 'Upcoming events', upcomingEventsUpper: 'UPCOMING EVENTS',
    noUpcomingEvents: 'No upcoming events.',
    upcomingInSeries: 'Upcoming events in this series', otherSeries: 'Other recurring series',
    recurringEventsUpper: 'RECURRING EVENTS', recurring: 'Recurring',
    specialEventsUpper: 'SPECIAL EVENTS', specialEvent: 'Special event',
    shareEvent: 'Share this event', addToCalendar: 'Add to calendar',
    tickets: 'Tickets', details: 'Details', chooseDay: 'Choose a day',
    showMoreDays: 'Show more days', previousWeeks: 'Previous weeks', nextWeeks: 'Next weeks',
    previous: 'Previous', next: 'Next', slide: 'Slide',
    ourMusicians: 'Our musicians', upcomingPerformances: 'Upcoming performances',
    reserveTable: 'Reserve a table', bookNow: 'Book now',
    seeFullMenuPdf: 'See full menu (PDF)', openingHours: 'Opening hours', closedUpper: 'CLOSED',
    callUs: 'Call us', writeToUs: 'Write to us', contactUsUpper: 'CONTACT US',
    map: 'Map', emailAddress: 'Email address', acceptPrivacyPolicy: 'I accept the privacy policy',
    signUpUpper: 'SIGN UP', upTo: 'up to', people: 'people',
  },
  de: {
    intl: 'de-DE',
    news: 'Aktuelles', newsUpper: 'AKTUELLES', allNews: 'Alle Beiträge',
    noNews: 'Noch keine Beiträge.', relatedNews: 'Das könnte Sie auch interessieren',
    readMore: 'Weiterlesen', readMoreEllipsis: 'Weiterlesen…', back: 'Zurück',
    program: 'PROGRAMM', calendarUpper: 'KALENDER',
    seeFullProgram: 'GESAMTES PROGRAMM ANSEHEN', seeProgram: 'Programm ansehen',
    upcomingEvents: 'Kommende Veranstaltungen', upcomingEventsUpper: 'KOMMENDE VERANSTALTUNGEN',
    noUpcomingEvents: 'Keine kommenden Veranstaltungen.',
    upcomingInSeries: 'Kommende Termine dieser Reihe', otherSeries: 'Weitere Veranstaltungsreihen',
    recurringEventsUpper: 'VERANSTALTUNGSREIHEN', recurring: 'Wiederkehrend',
    specialEventsUpper: 'BESONDERE VERANSTALTUNGEN', specialEvent: 'Besondere Veranstaltung',
    shareEvent: 'Veranstaltung teilen', addToCalendar: 'Zum Kalender hinzufügen',
    tickets: 'Tickets', details: 'Details', chooseDay: 'Tag wählen',
    showMoreDays: 'Weitere Tage anzeigen', previousWeeks: 'Vorherige Wochen', nextWeeks: 'Nächste Wochen',
    previous: 'Zurück', next: 'Weiter', slide: 'Element',
    ourMusicians: 'Unsere Musiker', upcomingPerformances: 'Nächste Auftritte',
    reserveTable: 'Tisch reservieren', bookNow: 'Reservieren',
    seeFullMenuPdf: 'Gesamte Karte ansehen (PDF)', openingHours: 'Öffnungszeiten', closedUpper: 'GESCHLOSSEN',
    callUs: 'Rufen Sie uns an', writeToUs: 'Schreiben Sie uns', contactUsUpper: 'KONTAKTIEREN SIE UNS',
    map: 'Karte', emailAddress: 'E-Mail-Adresse', acceptPrivacyPolicy: 'Ich akzeptiere die Datenschutzerklärung',
    signUpUpper: 'ANMELDEN', upTo: 'bis zu', people: 'Personen',
  },
  fr: {
    intl: 'fr-FR',
    news: 'Actualités', newsUpper: 'ACTUALITÉS', allNews: 'Toutes les actualités',
    noNews: 'Aucune actualité pour le moment.', relatedNews: 'À voir également',
    readMore: 'Lire la suite', readMoreEllipsis: 'Lire la suite…', back: 'Retour',
    program: 'PROGRAMME', calendarUpper: 'CALENDRIER',
    seeFullProgram: 'VOIR TOUT LE PROGRAMME', seeProgram: 'Voir le programme',
    upcomingEvents: 'Événements à venir', upcomingEventsUpper: 'ÉVÉNEMENTS À VENIR',
    noUpcomingEvents: 'Aucun événement à venir.',
    upcomingInSeries: 'Prochaines dates de ce cycle', otherSeries: 'Autres cycles d’événements',
    recurringEventsUpper: 'ÉVÉNEMENTS RÉCURRENTS', recurring: 'Récurrent',
    specialEventsUpper: 'ÉVÉNEMENTS SPÉCIAUX', specialEvent: 'Événement spécial',
    shareEvent: 'Partager cet événement', addToCalendar: 'Ajouter au calendrier',
    tickets: 'Billets', details: 'Détails', chooseDay: 'Choisir un jour',
    showMoreDays: 'Afficher plus de jours', previousWeeks: 'Semaines précédentes', nextWeeks: 'Semaines suivantes',
    previous: 'Précédent', next: 'Suivant', slide: 'Élément',
    ourMusicians: 'Nos musiciens', upcomingPerformances: 'Prochains concerts',
    reserveTable: 'Réserver une table', bookNow: 'Réserver',
    seeFullMenuPdf: 'Voir toute la carte (PDF)', openingHours: 'Horaires d’ouverture', closedUpper: 'FERMÉ',
    callUs: 'Appelez-nous', writeToUs: 'Écrivez-nous', contactUsUpper: 'CONTACTEZ-NOUS',
    map: 'Plan', emailAddress: 'Adresse e-mail', acceptPrivacyPolicy: 'J’accepte la politique de confidentialité',
    signUpUpper: 'S’INSCRIRE', upTo: "jusqu'à", people: 'personnes',
  },
  es: {
    intl: 'es-ES',
    news: 'Actualidad', newsUpper: 'ACTUALIDAD', allNews: 'Todas las noticias',
    noNews: 'Todavía no hay noticias.', relatedNews: 'Ver también',
    readMore: 'Leer más', readMoreEllipsis: 'Leer más…', back: 'Volver',
    program: 'PROGRAMA', calendarUpper: 'CALENDARIO',
    seeFullProgram: 'VER EL PROGRAMA COMPLETO', seeProgram: 'Ver el programa',
    upcomingEvents: 'Próximos eventos', upcomingEventsUpper: 'PRÓXIMOS EVENTOS',
    noUpcomingEvents: 'No hay próximos eventos.',
    upcomingInSeries: 'Próximas fechas de este ciclo', otherSeries: 'Otros ciclos de eventos',
    recurringEventsUpper: 'EVENTOS PERIÓDICOS', recurring: 'Periódico',
    specialEventsUpper: 'EVENTOS ESPECIALES', specialEvent: 'Evento especial',
    shareEvent: 'Compartir este evento', addToCalendar: 'Añadir al calendario',
    tickets: 'Entradas', details: 'Detalles', chooseDay: 'Elegir día',
    showMoreDays: 'Mostrar más días', previousWeeks: 'Semanas anteriores', nextWeeks: 'Semanas siguientes',
    previous: 'Anterior', next: 'Siguiente', slide: 'Elemento',
    ourMusicians: 'Nuestros músicos', upcomingPerformances: 'Próximas actuaciones',
    reserveTable: 'Reservar mesa', bookNow: 'Reservar',
    seeFullMenuPdf: 'Ver la carta completa (PDF)', openingHours: 'Horario', closedUpper: 'CERRADO',
    callUs: 'Llámanos', writeToUs: 'Escríbenos', contactUsUpper: 'CONTACTA CON NOSOTROS',
    map: 'Mapa', emailAddress: 'Correo electrónico', acceptPrivacyPolicy: 'Acepto la política de privacidad',
    signUpUpper: 'SUSCRIBIRSE', upTo: 'hasta', people: 'personas',
  },
}

/** Teksty interfejsu dla danego języka. */
export function ui(locale: Locale): UIStrings {
  return UI_STRINGS[locale] ?? UI_STRINGS.pl
}

/** Tag BCP-47 do `Intl.DateTimeFormat` / `toLocaleString`. */
export function intlLocale(locale: Locale): string {
  return ui(locale).intl
}
