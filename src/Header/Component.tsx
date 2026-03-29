import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'

import type { Header, Media } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { CMSLink } from '@/components/Link'
import { MobileMenu } from './MobileMenu'

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

export async function Header({ locale }: { locale: Locale }) {
  const cachedHeader = unstable_cache(
    () => getHeader(locale),
    [`header-${locale}`],
    { tags: ['global_header'] },
  )
  const header = await cachedHeader()

  const {
    topBarText,
    phone,
    address,
    logo,
    socialLinks,
    navItemsLeft,
    navItemsRight,
    ctaButton,
  } = header || {}

  const logoMedia = logo && typeof logo === 'object' ? (logo as Media) : null

  return (
    <header className="w-full sticky top-0 z-50">
      {/* ── Top bar ── */}
      <div className="bg-brand-gold">
        <div className="container flex items-center justify-between py-2 text-[13px] font-medium text-brand-navy">
          {/* Announcement — hidden on small screens */}
          {topBarText && (
            <span className="hidden md:block leading-tight">{topBarText}</span>
          )}

          {/* Phone + address */}
          <div className="flex items-center gap-5 ml-auto">
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                {/* Phone icon */}
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
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
                className="hidden sm:flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                {/* Location icon */}
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                {address}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Main nav ── */}
      <div className="bg-brand-navy">
        <div className="container relative flex items-center justify-between py-4">

          {/* ── LEFT: social icons + left nav (desktop only) ── */}
          <div className="hidden lg:flex items-center gap-6 flex-1">
            {/* Social links */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-brand-gold transition-colors"
                    aria-label={social.platform}
                  >
                    <SocialIcon platform={social.platform} />
                  </a>
                ))}
              </div>
            )}

            {/* Left nav items */}
            {navItemsLeft && navItemsLeft.length > 0 && (
              <nav className="flex items-center gap-6">
                {navItemsLeft.map(({ link }, i) => (
                  <CMSLink
                    key={i}
                    {...link}
                    locale={locale}
                    className="text-white uppercase tracking-[0.12em] text-[11px] font-semibold hover:text-brand-gold transition-colors whitespace-nowrap"
                  />
                ))}
              </nav>
            )}
          </div>

          {/* ── CENTER: logo ── */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden lg:block">
            <Link href={`/${locale}`} className="block">
              {logoMedia?.url ? (
                <Image
                  src={logoMedia.url}
                  alt={logoMedia.alt || 'American Dream Club'}
                  width={220}
                  height={100}
                  className="h-20 w-auto"
                  priority
                />
              ) : (
                <div className="text-center leading-tight">
                  <div className="text-brand-gold font-bold text-[15px] tracking-[0.25em] uppercase">
                    American Dream
                  </div>
                  <div className="text-brand-gold text-[8px] tracking-[0.35em] uppercase border-t border-b border-[#C8941A] py-0.5 my-0.5">
                    ★ Club ★
                  </div>
                  <div className="text-white/60 text-[7px] tracking-[0.2em] uppercase">
                    Jazz &amp; Restaurant
                  </div>
                </div>
              )}
            </Link>
          </div>

          {/* Mobile: logo (visible on small screens) */}
          <div className="lg:hidden">
            <Link href={`/${locale}`} className="block">
              {logoMedia?.url ? (
                <Image
                  src={logoMedia.url}
                  alt={logoMedia.alt || 'American Dream Club'}
                  width={280}
                  height={120}
                  className="h-28 w-auto"
                  priority
                />
              ) : (
                <div className="text-center leading-tight">
                  <div className="text-brand-gold font-bold text-[13px] tracking-[0.2em] uppercase">
                    American Dream
                  </div>
                  <div className="text-white/60 text-[7px] tracking-[0.15em] uppercase">
                    Jazz &amp; Restaurant
                  </div>
                </div>
              )}
            </Link>
          </div>

          {/* ── RIGHT: right nav + language switcher + CTA (desktop only) ── */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-end">
            {/* Right nav items */}
            {navItemsRight && navItemsRight.length > 0 && (
              <nav className="flex items-center gap-6">
                {navItemsRight.map(({ link }, i) => (
                  <CMSLink
                    key={i}
                    {...link}
                    locale={locale}
                    className="text-white uppercase tracking-[0.12em] text-[11px] font-semibold hover:text-brand-gold transition-colors whitespace-nowrap"
                  />
                ))}
              </nav>
            )}

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

            {/* CTA button */}
            {ctaButton && (
              <CMSLink
                {...ctaButton}
                locale={locale}
                className="bg-brand-gold text-white px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-brand-gold-dark transition-colors flex items-center gap-2 whitespace-nowrap"
              />
            )}
          </div>

          {/* Mobile hamburger */}
          <MobileMenu
            navItemsLeft={(navItemsLeft as Parameters<typeof MobileMenu>[0]['navItemsLeft']) || []}
            navItemsRight={(navItemsRight as Parameters<typeof MobileMenu>[0]['navItemsRight']) || []}
            socialLinks={(socialLinks as Parameters<typeof MobileMenu>[0]['socialLinks']) || []}
            ctaButton={ctaButton as Parameters<typeof MobileMenu>[0]['ctaButton']}
            locale={locale}
          />
        </div>
      </div>
    </header>
  )
}
