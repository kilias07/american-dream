import { getPayload } from 'payload'
import config from '@payload-config'
import { locales, defaultLocale, type Locale } from '@/config/locales'
import { notFound } from 'next/navigation'
import type { Reservation, ReservationSetting } from '@/payload-types'
import { StatusCard } from '@/components/reservations/StatusCard'

// Post-payment / post-submit landing (spec §3). PayU's continueUrl and the free
// flow both send the user here with `?id=<reservationNumber>`.

type Tone = 'success' | 'pending' | 'error'

const tr = (locale: Locale, pl: string, en: string) => (locale === 'en' ? en : pl)

function resolve(
  reservation: Reservation | null,
  texts: ReservationSetting['texts'] | undefined,
  locale: Locale,
): { tone: Tone; heading: string; message: string } {
  if (!reservation) {
    return {
      tone: 'error',
      heading: tr(locale, 'Nie znaleziono rezerwacji', 'Reservation not found'),
      message: tr(
        locale,
        'Nie udało się odnaleźć tej rezerwacji. Sprawdź link lub skontaktuj się z nami.',
        'We could not find this reservation. Please check the link or contact us.',
      ),
    }
  }

  const { status, paymentStatus } = reservation
  const paidAccepted = texts?.paidAcceptedMessage
  const freePending = texts?.freePendingMessage

  if (paymentStatus === 'failed') {
    return {
      tone: 'error',
      heading: tr(locale, 'Płatność nieudana', 'Payment failed'),
      message: tr(
        locale,
        'Płatność nie została zakończona. Możesz spróbować ponownie lub skontaktować się z nami.',
        'The payment was not completed. You can try again or contact us.',
      ),
    }
  }

  if (status === 'awaiting_payment') {
    return {
      tone: 'pending',
      heading: tr(locale, 'Przetwarzamy płatność', 'Processing payment'),
      message: tr(
        locale,
        'Oczekujemy na potwierdzenie płatności. Tę stronę możesz odświeżyć za chwilę.',
        'We are waiting for payment confirmation. You can refresh this page in a moment.',
      ),
    }
  }

  if (status === 'confirmed') {
    return {
      tone: 'success',
      heading: tr(locale, 'Rezerwacja potwierdzona', 'Reservation confirmed'),
      message: tr(locale, 'Do zobaczenia w American Dream Club!', 'See you at American Dream Club!'),
    }
  }

  if (status === 'rejected' || status === 'cancelled') {
    return {
      tone: 'error',
      heading: tr(locale, 'Rezerwacja anulowana', 'Reservation cancelled'),
      message: tr(
        locale,
        'Ta rezerwacja została anulowana. W razie pytań skontaktuj się z nami.',
        'This reservation has been cancelled. Please contact us with any questions.',
      ),
    }
  }

  // awaiting_approval — paid vs free wording.
  if (paymentStatus === 'paid') {
    return {
      tone: 'success',
      heading: tr(locale, 'Płatność przyjęta', 'Payment received'),
      message:
        paidAccepted ||
        tr(
          locale,
          'Płatność przyjęta, czekamy na potwierdzenie obsługi. W razie odrzucenia zwrócimy środki.',
          'Payment received, awaiting staff confirmation. If rejected, we will refund you.',
        ),
    }
  }

  return {
    tone: 'pending',
    heading: tr(locale, 'Rezerwacja przyjęta', 'Reservation received'),
    message:
      freePending ||
      tr(
        locale,
        'Twoja rezerwacja oczekuje na zatwierdzenie obsługi. Potwierdzenie wyślemy SMS-em i e-mailem.',
        'Your reservation is awaiting staff approval. We will confirm by SMS and email.',
      ),
  }
}

export default async function ReservationStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ id?: string }>
}) {
  const { locale: rawLocale } = await params
  if (!locales.includes(rawLocale as Locale)) notFound()
  const locale = rawLocale as Locale
  const { id } = await searchParams

  let reservation: Reservation | null = null
  let texts: ReservationSetting['texts'] | undefined
  try {
    const payload = await getPayload({ config })
    if (id) {
      const { docs } = await payload.find({
        collection: 'reservations',
        where: { reservationNumber: { equals: id } },
        limit: 1,
        depth: 0,
      })
      reservation = (docs[0] as Reservation) ?? null
    }
    const settings = await payload.findGlobal({
      slug: 'reservation-settings',
      locale,
      fallbackLocale: defaultLocale,
      depth: 0,
    })
    texts = settings?.texts
  } catch {
    // Render the not-found/error card below.
  }

  const { tone, heading, message } = resolve(reservation, texts, locale)
  const footer = tr(
    locale,
    'Pytania? rezerwacja@americandreamclub.pl · +48 500 210 333',
    'Questions? rezerwacja@americandreamclub.pl · +48 500 210 333',
  )

  return (
    <div className="bg-brand-navy text-white min-h-screen">
      <section className="pt-36 md:pt-44 pb-20 md:pb-28">
        <StatusCard
          tone={tone}
          heading={heading}
          message={message}
          reservationNumber={reservation?.reservationNumber ?? undefined}
          footer={footer}
        />
      </section>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const isEn = locale === 'en'
  return {
    title: isEn ? 'Reservation status' : 'Status rezerwacji',
    robots: { index: false, follow: false },
  }
}
