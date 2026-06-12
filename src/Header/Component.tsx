import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'

import type { Header } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { CMSLink } from '@/components/Link'
import { ReserveTrigger } from '@/components/reservations/MyRest'
import { MobileMenu } from './MobileMenu'
import { Logo } from './Logo'
import { HeaderShell } from './HeaderShell'

const SocialIcon = ({ platform }: { platform: string }) => {
  const cls = 'w-4 h-4 fill-current'
  switch (platform) {
    case 'google':
      return (
        <svg className={cls} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
      )
    case 'facebook':
      return (
        <svg className={cls} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg className={cls} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg className={cls} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg className={cls} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      )
    default:
      return null
  }
}

async function getHeader(locale: Locale): Promise<Header | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    return payload.findGlobal({ slug: 'header', locale, depth: 1 })
  } catch {
    return null
  }
}

type SocialEntry = { platform: string; url: string }

/**
 * Social links pochodzą z JEDNEGO miejsca — globalu „Site Settings” (pole
 * `social`). Header, mobilne menu, stopka i SEO czytają z tego samego źródła,
 * więc edycja w jednym miejscu zmienia je wszędzie.
 */
async function getSocialLinks(): Promise<SocialEntry[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    return (settings?.social ?? [])
      .filter((s) => Boolean(s?.platform && s?.url))
      .map((s) => ({ platform: s.platform as string, url: s.url as string }))
  } catch {
    return []
  }
}

export async function Header({ locale }: { locale: Locale }) {
  const cachedHeader = unstable_cache(
    () => getHeader(locale),
    [`header-${locale}`],
    { tags: ['global_header'] },
  )
  const header = await cachedHeader()

  const cachedSocial = unstable_cache(() => getSocialLinks(), ['social-links'], {
    tags: ['global_site_settings'],
  })
  const socialLinks = await cachedSocial()

  const {
    topBarText,
    phone,
    address,
    navItems,
    ctaButton,
    ctaEnabled,
  } = header || {}

  const allNavItems = navItems || []

  return (
    <HeaderShell
      topBar={
        /* ── Top bar (gold) ── */
        <div className="bg-brand-gold">
        <div className="container flex items-center justify-between py-2 text-[12px] font-medium text-brand-navy">

          {/* Lewa strona: telefon + adres */}
          <div className="flex items-center gap-4">
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                {phone}
              </a>
            )}
            {address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                {address}
              </a>
            )}
            {topBarText && (
              <span className="hidden lg:block leading-tight">{topBarText}</span>
            )}
          </div>

          {/* Prawa strona: social icons */}
          <div className="flex items-center gap-3">
            {socialLinks && socialLinks.length > 0 && (
              <>
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-60 transition-opacity"
                    aria-label={social.platform}
                  >
                    <SocialIcon platform={social.platform} />
                  </a>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
      }
      nav={
        /* ── Main nav (navy) ──
           Layout (desktop):
             [Logo — left]  [Nav links — center]  [Lang + CTA — right]
           Używamy CSS Grid cols=[auto 1fr auto] żeby środkowy nav był
           wyśrodkowany w dostępnej przestrzeni. */
        <div className="bg-brand-navy">
        <div className="container h-[90px] hidden lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-3 xl:gap-6">

          {/* LEWA: Logo */}
          <Link href={`/${locale}`} className="flex-shrink-0">
            <Logo className="h-14 xl:h-[68px] w-auto" />
          </Link>

          {/* ŚRODEK: Nav links — wyśrodkowane */}
          <nav className="flex items-center justify-center gap-3 xl:gap-6">
            {allNavItems.map(({ link }, i) => (
              <CMSLink
                key={i}
                {...link}
                locale={locale}
                className="text-white uppercase tracking-normal xl:tracking-[0.03em] text-[12px] xl:text-[13px] font-medium hover:text-brand-gold transition-colors whitespace-nowrap"
              />
            ))}
          </nav>

          {/* PRAWA: Language switcher + CTA */}
          <div className="flex items-center gap-2 xl:gap-4 flex-shrink-0">
            {/* Language switcher */}
            <div className="flex items-center gap-1 text-[12px] font-bold tracking-wider">
              <Link
                href="/pl"
                className={
                  locale === 'pl'
                    ? 'text-brand-gold'
                    : 'text-white hover:text-brand-gold transition-colors'
                }
              >
                PL
              </Link>
              <span className="text-white/40 mx-0.5">|</span>
              <Link
                href="/en"
                className={
                  locale === 'en'
                    ? 'text-brand-gold'
                    : 'text-white hover:text-brand-gold transition-colors'
                }
              >
                EN
              </Link>
            </div>

            {/* CTA — "Zarezerwuj" → opens the MyRest booking widget */}
            {ctaEnabled && ctaButton?.label && (
              <ReserveTrigger className="bg-brand-gold text-brand-navy px-3.5 xl:px-5 py-2.5 rounded-full text-[11px] xl:text-[12px] font-bold uppercase tracking-[0.02em] xl:tracking-[0.06em] hover:brightness-110 transition-all whitespace-nowrap">
                {ctaButton.label}
              </ReserveTrigger>
            )}
          </div>
        </div>

        {/* ── Mobile nav ── */}
        <div className="lg:hidden container flex items-center justify-between h-[70px]">
          <Link href={`/${locale}`}>
            <Logo className="h-14 w-auto" />
          </Link>
          <MobileMenu
            navItems={(navItems as Parameters<typeof MobileMenu>[0]['navItems']) || []}
            socialLinks={(socialLinks as Parameters<typeof MobileMenu>[0]['socialLinks']) || []}
            ctaButton={ctaButton as Parameters<typeof MobileMenu>[0]['ctaButton']}
            ctaEnabled={ctaEnabled}
            locale={locale}
          />
        </div>
      </div>
      }
    />
  )
}
