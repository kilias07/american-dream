import type { Event, Media } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeUrl } from '@/utilities/seo'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://americandreamclub.pl'

function mediaUrl(value: number | null | Media | undefined): string | null {
  if (typeof value === 'object' && value !== null && value.url) {
    return value.url.startsWith('http') ? value.url : `${SITE_URL}${value.url}`
  }
  return null
}

export function EventJsonLd({ event, locale }: { event: Event; locale: Locale }) {
  const image = mediaUrl(event.image) ?? mediaUrl(event.posterImage)
  const url = localeUrl(locale, `events/${event.slug}`)
  const offerUrl = event.ticketUrl || event.reservationUrl || url

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title ?? undefined,
    description: event.description ?? undefined,
    ...(event.date ? { startDate: event.date } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(image ? { image: [image] } : {}),
    url,
    location: {
      '@type': 'Place',
      name: 'American Dream Club',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'ul. Dominikańska 9',
        postalCode: '61-762',
        addressLocality: 'Poznań',
        addressCountry: 'PL',
      },
    },
    ...(event.price != null
      ? {
          offers: {
            '@type': 'Offer',
            price: event.price,
            priceCurrency: 'PLN',
            url: offerUrl,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
