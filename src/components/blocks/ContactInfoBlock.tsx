import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { ContactInfoBlock as ContactInfoBlockType, SiteSetting, OpeningHour } from '@/payload-types'
import { ContactFormClient } from './ContactFormClient'
import { Logo } from '@/Header/Logo'

const DAY_LABELS: Record<string, { pl: string; en: string }> = {
  monday: { pl: 'Poniedziałek', en: 'Monday' },
  tuesday: { pl: 'Wtorek', en: 'Tuesday' },
  wednesday: { pl: 'Środa', en: 'Wednesday' },
  thursday: { pl: 'Czwartek', en: 'Thursday' },
  friday: { pl: 'Piątek', en: 'Friday' },
  saturday: { pl: 'Sobota', en: 'Saturday' },
  sunday: { pl: 'Niedziela', en: 'Sunday' },
}

export async function ContactInfoBlock({
  block,
  locale,
}: {
  block: ContactInfoBlockType
  locale: string
}) {
  const payload = await getPayload({ config })

  const [siteSettings, openingHours] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', locale: locale as 'pl' | 'en' | 'all', depth: 1 }) as Promise<SiteSetting>,
    payload.findGlobal({ slug: 'opening-hours', locale: locale as 'pl' | 'en' | 'all' }) as Promise<OpeningHour>,
  ])

  const address = siteSettings?.address
  const emails = (siteSettings?.emails ?? []).filter((e) => e.email)
  const phones = (siteSettings?.phones ?? []).filter((p) => p.number)
  const days = openingHours?.days ?? []
  const mapUrl = siteSettings?.mapEmbedUrl

  const closedLabel = locale === 'pl' ? 'ZAMKNIĘTE' : 'CLOSED'
  const formHeading = block.formHeading || (locale === 'pl' ? 'SKONTAKTUJ SIĘ Z NAMI' : 'CONTACT US')

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* LEFT — contact info */}
          <div>
            {/* Emblem + address + serif headings, centered (per design) */}
            <div className="text-center mb-10">
              <Logo className="h-20 w-auto mx-auto mb-4" />
              {address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-white/90 text-base leading-snug hover:text-brand-gold transition-colors mb-6"
                >
                  {address}
                </a>
              )}

              {emails.length > 0 && (
                <div className="mb-6">
                  <p className="text-brand-gold font-serif text-2xl mb-2">
                    {locale === 'pl' ? 'Napisz do nas' : 'Write to us'}
                  </p>
                  <ul className="space-y-1">
                    {emails.map((e) => (
                      <li key={e.id}>
                        <a
                          href={`mailto:${e.email}`}
                          className="text-white hover:text-brand-gold transition-colors"
                        >
                          {e.email}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {phones.length > 0 && (
                <div>
                  <p className="text-brand-gold font-serif text-2xl mb-2">
                    {locale === 'pl' ? 'Zadzwoń do nas' : 'Call us'}
                  </p>
                  <ul className="space-y-1">
                    {phones.map((p) => (
                      <li key={p.id}>
                        <a
                          href={`tel:${(p.number || '').replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-2 text-white hover:text-brand-gold transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-gold">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.13 6.13l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          {p.number}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {days.length > 0 && (
              <div>
                <p className="text-brand-gold text-xs font-bold uppercase tracking-[0.18em] mb-3">
                  {locale === 'pl' ? 'Godziny otwarcia' : 'Opening hours'}
                </p>
                <ul className="space-y-2">
                  {days.map((d) => {
                    const dayName = d.day ? DAY_LABELS[d.day]?.[locale === 'pl' ? 'pl' : 'en'] ?? d.day : ''
                    const hours = d.closed
                      ? closedLabel
                      : d.openTime && d.closeTime
                        ? `${d.openTime} – ${d.closeTime}`
                        : closedLabel
                    return (
                      <li
                        key={d.id}
                        className="flex items-center justify-between gap-4 bg-brand-navy-royal rounded-full px-5 py-2.5"
                      >
                        <span className="text-white text-sm font-medium">{dayName}</span>
                        <span
                          className={`text-sm font-bold ${d.closed ? 'text-white/40' : 'text-brand-gold'}`}
                        >
                          {hours}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>

          {/* RIGHT — form + map */}
          <div>
            {block.showForm && <ContactFormClient formHeading={formHeading} locale={locale} />}

            {block.showMap && mapUrl && (
              <div className={`overflow-hidden rounded-2xl ${block.showForm ? 'mt-10' : ''}`}>
                <iframe
                  src={mapUrl}
                  title={locale === 'pl' ? 'Mapa' : 'Map'}
                  className="w-full h-[320px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
