import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/config/locales'
import { localizedAlternates } from '@/utilities/seo'
import { ReserveTrigger } from '@/components/reservations/MyRest'
import { getReservationDict } from '@/components/reservations/dictionary'

const COPY: Record<Locale, { title: string; lead: string; cta: string }> = {
  pl: {
    title: 'Rezerwacje',
    lead: 'Zarezerwuj stolik na otwarcie wieczoru, kup bilet na koncert lub dołącz na wieczór klubowy. Wybierz opcję, termin i liczbę osób — resztą zajmiemy się my.',
    cta: 'Rozpocznij rezerwację',
  },
  en: {
    title: 'Reservations',
    lead: 'Book a table for the evening opening, buy a concert ticket, or join us for a club night. Pick an option, a date and the number of guests — we will handle the rest.',
    cta: 'Start a reservation',
  },
}

export default async function ReservationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  if (!locales.includes(raw as Locale)) notFound()
  const locale = raw as Locale
  const c = COPY[locale]
  const dict = getReservationDict(locale)

  return (
    <div className="bg-brand-navy text-white min-h-screen">
      <section className="pt-36 md:pt-44 pb-20 md:pb-28">
        <div className="max-w-[760px] mx-auto px-6 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">{c.title}</h1>
          <p className="mt-6 text-white/75 leading-relaxed">{c.lead}</p>

          <div className="mt-10">
            <ReserveTrigger className="rounded-full bg-brand-gold px-9 py-4 text-base font-semibold text-brand-navy transition hover:brightness-110">
              {c.cta}
            </ReserveTrigger>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-3 text-left">
            {(['opening', 'concert', 'club'] as const).map((key) => (
              <div key={key} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-semibold">{dict.options[key].label}</h3>
                <p className="mt-2 text-sm text-white/60">{dict.options[key].info}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const c = COPY[(locale as Locale) in COPY ? (locale as Locale) : 'pl']
  return {
    title: c.title,
    alternates: localizedAlternates(locale, 'rezerwacja'),
  }
}
