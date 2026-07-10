import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Footer as FooterType } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'
import { Logo } from '@/Header/Logo'
import { NewsletterForm } from './NewsletterForm'
import { getUILabels, pick } from '@/lib/ui-labels'

async function getFooter(locale: Locale): Promise<FooterType | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    // `await` so a rejected query is caught here (e.g. DB unreachable at build
    // time) instead of escaping to the caller and aborting static generation.
    return await payload.findGlobal({ slug: 'footer', locale, depth: 0 })
  } catch {
    return null
  }
}

type OpeningDay = {
  day?: string | null
  closed?: boolean | null
  openTime?: string | null
  closeTime?: string | null
  id?: string | null
}

async function getOpeningDays(): Promise<OpeningDay[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const oh = await payload.findGlobal({ slug: 'opening-hours', depth: 0 })
    return (oh?.days as OpeningDay[]) ?? []
  } catch {
    return []
  }
}

type SocialEntry = { platform: string; url: string }

type SiteContact = {
  phone: string | null
  address: string | null
  social: SocialEntry[]
}

// Contact details + social — jedno źródło prawdy: global „Site Settings”
// (pola `phones`, `address`, `social`). Footer czyta stąd, więc edycja w jednym
// miejscu zmienia stopkę (i resztę strony). `address` jest localized.
async function getSiteContact(locale: Locale): Promise<SiteContact> {
  try {
    const payload = await getPayload({ config: configPromise })
    const settings = await payload.findGlobal({ slug: 'site-settings', locale, depth: 0 })
    const social = (settings?.social ?? [])
      .filter((s) => Boolean(s?.platform && s?.url))
      .map((s) => ({ platform: s.platform as string, url: s.url as string }))
    const phone = settings?.phones?.find((p) => p?.number)?.number ?? null
    const address = settings?.address ?? null
    return { phone, address, social }
  } catch {
    return { phone: null, address: null, social: [] }
  }
}

const DAY_LABELS: Record<string, { pl: string; en: string }> = {
  monday: { pl: 'Poniedziałek', en: 'Monday' },
  tuesday: { pl: 'Wtorek', en: 'Tuesday' },
  wednesday: { pl: 'Środa', en: 'Wednesday' },
  thursday: { pl: 'Czwartek', en: 'Thursday' },
  friday: { pl: 'Piątek', en: 'Friday' },
  saturday: { pl: 'Sobota', en: 'Saturday' },
  sunday: { pl: 'Niedziela', en: 'Sunday' },
}
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  google: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  googleMaps: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </svg>
  ),
  facebook: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  youtube: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
    </svg>
  ),
  tiktok: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
}

export async function Footer({ locale }: { locale: Locale }) {
  const cachedFooter = unstable_cache(
    () => getFooter(locale),
    [`footer-${locale}`],
    { tags: ['global_footer'] },
  )
  const footer = await cachedFooter()

  const cachedOpeningDays = unstable_cache(() => getOpeningDays(), ['footer-opening-days'], {
    tags: ['global_opening_hours'],
  })
  const openingDaysRaw = await cachedOpeningDays()
  const openingDays = DAY_ORDER.map((d) => openingDaysRaw.find((od) => od.day === d)).filter(
    (od): od is OpeningDay => Boolean(od),
  )

  const cachedContact = unstable_cache(
    () => getSiteContact(locale),
    [`footer-site-contact-${locale}`],
    { tags: ['global_site_settings'] },
  )
  const { phone, address, social: socialLinks } = await cachedContact()

  // Interface microcopy (weekday names, "opening hours", "closed") from CMS.
  const ui = await getUILabels(locale)
  const pl = locale === 'pl'
  const dayName = (day: string) =>
    pick(
      (ui?.days as Record<string, string | null | undefined> | undefined)?.[day],
      DAY_LABELS[day]?.[pl ? 'pl' : 'en'] ?? '',
    )

  // Fall back to the known values if Site Settings is empty, so the footer never
  // renders blank contact details. Address splits on the first comma into two
  // visual lines (street / postcode + city) to keep the design.
  const phoneDisplay = phone ?? '+48 500 210 333'
  const addressDisplay = address ?? 'ul. Dominikańska 9, 61-762 Poznań'
  const [addrLine1, ...addrRest] = addressDisplay.split(',')
  const addrLine2 = addrRest.join(',').trim()

  const navColumns = footer?.navColumns || []
  const bottomBarLinks = footer?.bottomBarLinks || []

  return (
    <footer className="bg-brand-gold">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[200px_1fr_1fr_1fr_220px] gap-8 items-start">

          {/* Logo + contact */}
          <div className="flex flex-col gap-4">
            <Link href={localeHref(locale, '/')} aria-label="American Dream Club">
              <Logo variant="navy" className="w-48 h-auto" />
            </Link>
            <div className="flex flex-col gap-1.5 mt-2">
              <a
                href={`tel:${phoneDisplay.replace(/\s/g, '')}`}
                className="flex items-center gap-2 text-brand-navy text-sm font-medium hover:opacity-70 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-navy shrink-0">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.36a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.13 6.13l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {phoneDisplay}
              </a>
              <div className="flex items-start gap-2 text-brand-navy text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-navy shrink-0 mt-0.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>
                  {addrLine1.trim()}
                  {addrLine2 && (
                    <>
                      <br />
                      {addrLine2}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Opening hours column (from OpeningHours global) */}
          {openingDays.length > 0 && (
            <div>
              <p className="text-brand-navy text-xs font-bold uppercase tracking-[0.1em] mb-4">
                {pick(ui?.common?.openingHours, pl ? 'Godziny otwarcia' : 'Opening hours')}
              </p>
              <ul className="flex flex-col gap-2">
                {openingDays.map((od) => {
                  const label = od.day ? dayName(od.day) : ''
                  const hours = od.closed
                    ? pick(ui?.common?.closed, pl ? 'Zamknięte' : 'Closed')
                    : `${od.openTime ?? ''}${od.closeTime ? `–${od.closeTime}` : ''}`
                  return (
                    <li
                      key={od.id ?? od.day}
                      className="flex items-baseline justify-between gap-2 text-brand-navy text-sm"
                    >
                      <span>{label}</span>
                      <span className="text-brand-navy/80 whitespace-nowrap">{hours}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Nav columns from Payload */}
          {navColumns.map((col) => (
            <div key={col.id}>
              <p className="text-brand-navy text-xs font-bold uppercase tracking-[0.1em] mb-4">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {(col.links || []).map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.url.startsWith('/') ? localeHref(locale, link.url) : link.url}
                      target={link.newTab ? '_blank' : undefined}
                      className="text-brand-navy text-sm hover:opacity-60 transition-opacity"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter + 21+ */}
          <div className="flex flex-col gap-4">
            <p className="text-brand-navy text-xs font-bold uppercase tracking-[0.1em]">
              {footer?.newsletter?.heading || 'Newsletter'}
            </p>
            <NewsletterForm
              placeholder={footer?.newsletter?.placeholder || undefined}
              consentText={footer?.newsletter?.consentText || undefined}
              submitLabel={footer?.newsletter?.buttonLabel || undefined}
            />
            <div className="self-end mt-2">
              <div className="w-12 h-12 rounded-full border-2 border-brand-navy flex items-center justify-center">
                <span className="text-brand-navy text-sm font-bold">21+</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-brand-navy">
        <div className="container max-w-[1280px] mx-auto px-6 md:px-10 py-3 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:justify-between gap-y-2 gap-x-4 items-center text-white/80 text-xs">
          {bottomBarLinks.map((link) => (
            <Link
              key={link.id}
              href={link.url.startsWith('/') ? localeHref(locale, link.url) : link.url}
              className="hover:text-white transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-3 lg:justify-end">
              {socialLinks.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  aria-label={s.platform}
                  className="hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {SOCIAL_ICONS[s.platform]}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
