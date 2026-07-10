import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { ContactInfoBlock as ContactInfoBlockType, SiteSetting, OpeningHour } from '@/payload-types'
import { ContactFormClient } from './ContactFormClient'
import { getUILabels, pick } from '@/lib/ui-labels'
import type { Locale } from '@/config/locales'

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

  const ui = await getUILabels(locale as Locale)
  const uiDays = ui?.days as Record<string, string | null | undefined> | undefined
  const closedLabel = pick(ui?.common?.closed, locale === 'pl' ? 'ZAMKNIĘTE' : 'CLOSED')
  const formHeading =
    block.formHeading ||
    pick(ui?.forms?.contactHeading, locale === 'pl' ? 'SKONTAKTUJ SIĘ Z NAMI' : 'CONTACT US')

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Row A — contact details (left) | form (right). Design = 2×2 quadrant. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* LEFT — contact details.
              Uwagi klienta 2026-07: bez logo w tym miejscu; telefon PRZED mailem
              (telefon ważniejszy); dane teleadresowe powiększone o 2–3 pkt. */}
          <div>
            <div className="text-center">
              {address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-white/90 text-lg md:text-xl leading-snug hover:text-brand-gold transition-colors mb-6"
                >
                  {address}
                </a>
              )}

              {phones.length > 0 && (
                <div className="mb-6">
                  <p className="text-brand-gold font-serif text-2xl mb-2">
                    {pick(ui?.common?.callUs, locale === 'pl' ? 'Zadzwoń do nas' : 'Call us')}
                  </p>
                  <ul className="space-y-1">
                    {phones.map((p) => (
                      <li key={p.id}>
                        <a
                          href={`tel:${(p.number || '').replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-2 text-white text-lg md:text-xl hover:text-brand-gold transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-gold">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.13 6.13l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          {p.number}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {emails.length > 0 && (
                <div>
                  <p className="text-brand-gold font-serif text-2xl mb-2">
                    {pick(ui?.common?.writeToUs, locale === 'pl' ? 'Napisz do nas' : 'Write to us')}
                  </p>
                  <ul className="space-y-1">
                    {emails.map((e) => (
                      <li key={e.id}>
                        <a
                          href={`mailto:${e.email}`}
                          className="text-white text-lg md:text-xl hover:text-brand-gold transition-colors"
                        >
                          {e.email}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT — contact form */}
          <div>
            {block.showForm && (
              <ContactFormClient
                formHeading={formHeading}
                locale={locale}
                labels={{
                  name: ui?.forms?.name,
                  phone: ui?.forms?.phone,
                  email: ui?.forms?.email,
                  message: ui?.forms?.message,
                  consent: ui?.forms?.consent,
                  submit: ui?.forms?.submit,
                  submitting: ui?.forms?.sending,
                  sent: ui?.forms?.success,
                  error: ui?.forms?.error,
                }}
              />
            )}
          </div>
        </div>

        {/* Row B — opening hours (left) | map (right). Forms the bottom of the 2×2 quadrant. */}
        {(days.length > 0 || (block.showMap && mapUrl)) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12 md:mt-16 items-start">
            <div>
              {days.length > 0 && (
                <div>
                  <p className="text-brand-gold text-xs font-bold uppercase tracking-[0.18em] mb-3">
                    {pick(ui?.common?.openingHours, locale === 'pl' ? 'Godziny otwarcia' : 'Opening hours')}
                  </p>
                  <ul className="space-y-2">
                    {days.map((d) => {
                      const dayName = d.day
                        ? pick(uiDays?.[d.day], DAY_LABELS[d.day]?.[locale === 'pl' ? 'pl' : 'en'] ?? d.day)
                        : ''
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
            <div>
              {block.showMap && mapUrl && (
                <div className="overflow-hidden rounded-2xl h-full min-h-[320px]">
                  <iframe
                    src={mapUrl}
                    title={locale === 'pl' ? 'Mapa' : 'Map'}
                    className="w-full h-full min-h-[320px] border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
