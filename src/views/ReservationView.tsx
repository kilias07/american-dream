import { type Locale } from '@/config/locales'
import { localizedAlternates } from '@/utilities/seo'
import { ReserveTrigger, AutoOpenMyRest } from '@/components/reservations/MyRest'

const COPY: Record<Locale, { title: string; lead: string; cta: string; phone: string }> = {
  pl: {
    title: 'Rezerwacje',
    lead: 'Zarezerwuj stolik w American Dream Club. Okno rezerwacji otworzy się automatycznie — jeśli nie, kliknij przycisk poniżej.',
    cta: 'Zarezerwuj stolik',
    phone: 'Wolisz telefonicznie? Zadzwoń:',
  },
  en: {
    title: 'Reservations',
    lead: 'Book a table at American Dream Club. The booking window opens automatically — if it does not, use the button below.',
    cta: 'Reserve a table',
    phone: 'Prefer to call? Phone:',
  },
}

export async function renderReservation(locale: Locale) {
  const c = COPY[locale]

  return (
    <div className="bg-brand-navy text-white min-h-screen">
      {/* Booking runs entirely through the MyRest widget (the same system as the
          old site). The page opens it on load and offers a manual trigger. */}
      <AutoOpenMyRest />
      <section className="pt-36 md:pt-44 pb-20 md:pb-28">
        <div className="max-w-[640px] mx-auto px-6 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">{c.title}</h1>
          <p className="mt-6 text-white/75 leading-relaxed">{c.lead}</p>

          <div className="mt-10">
            <ReserveTrigger className="rounded-full bg-brand-gold px-9 py-4 text-base font-semibold text-brand-navy transition hover:brightness-110">
              {c.cta}
            </ReserveTrigger>
          </div>

          <p className="mt-10 text-sm text-white/60">
            {c.phone}{' '}
            <a href="tel:+48500210333" className="text-brand-gold hover:underline">
              +48 500 210 333
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}

export async function reservationMetadata(locale: Locale) {
  const c = COPY[locale]
  return {
    title: c.title,
    alternates: localizedAlternates(locale, 'rezerwacja'),
  }
}
