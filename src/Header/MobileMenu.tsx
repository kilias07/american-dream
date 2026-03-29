'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { CMSLink } from '@/components/Link'

type NavItem = {
  link: {
    type?: 'reference' | 'custom' | null
    newTab?: boolean | null
    reference?: {
      relationTo: 'pages' | 'posts'
      value: { slug?: string } | string | number
    } | null
    url?: string | null
    label?: string | null
  }
}

type SocialLink = {
  platform: 'google' | 'facebook' | 'instagram' | 'youtube'
  url: string
}

type CtaButton = {
  type?: 'reference' | 'custom' | null
  newTab?: boolean | null
  reference?: {
    relationTo: 'pages' | 'posts'
    value: { slug?: string } | string | number
  } | null
  url?: string | null
  label?: string | null
}

type Props = {
  navItemsLeft: NavItem[]
  navItemsRight: NavItem[]
  socialLinks: SocialLink[]
  ctaButton: CtaButton | null | undefined
  ctaEnabled: boolean | null | undefined
  locale: string
}

const SocialIconMobile = ({ platform }: { platform: string }) => {
  const cls = 'w-5 h-5 fill-current'
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

export const MobileMenu: React.FC<Props> = ({
  navItemsLeft,
  navItemsRight,
  socialLinks,
  ctaButton,
  ctaEnabled,
  locale,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const allNavItems = [...navItemsLeft, ...navItemsRight]

  return (
    <div className="lg:hidden">
      {/* Hamburger button */}
      <button
        className="text-white p-2 flex flex-col gap-1.5"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <span className="block w-6 h-0.5 bg-white" />
        <span className="block w-6 h-0.5 bg-white" />
        <span className="block w-6 h-0.5 bg-white" />
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[99] bg-black/60 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer — slides in from the right */}
      <div
        className={`fixed top-0 right-0 z-[100] h-full w-full bg-brand-navy flex flex-col shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Close button */}
        <div className="flex justify-end mt-6 mr-6">
          <button
            className="text-white hover:text-brand-gold transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 flex-1 px-6 pt-4 overflow-y-auto">
          {allNavItems.map(({ link }, i) => (
            <div key={i} onClick={() => setIsOpen(false)} className="border-b border-white/10 last:border-0">
              <CMSLink
                {...(link as Parameters<typeof CMSLink>[0])}
                locale={locale}
                className="block py-3.5 text-white uppercase tracking-[0.12em] text-[13px] font-semibold hover:text-brand-gold transition-colors"
              />
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-6 pb-8 pt-4 flex flex-col gap-5">
          {/* CTA button */}
          {ctaEnabled && ctaButton && (
            <div onClick={() => setIsOpen(false)}>
              <CMSLink
                {...(ctaButton as Parameters<typeof CMSLink>[0])}
                locale={locale}
                className="block text-center bg-brand-gold text-white px-6 py-3 rounded-full text-[12px] font-bold uppercase tracking-[0.12em] hover:bg-brand-gold-dark transition-colors"
              />
            </div>
          )}

          {/* Language switcher */}
          <div className="flex items-center gap-2 text-[13px] font-bold tracking-wider">
            <Link
              href="/pl"
              className={locale === 'pl' ? 'text-brand-gold' : 'text-white hover:text-brand-gold transition-colors'}
              onClick={() => setIsOpen(false)}
            >
              PL
            </Link>
            <span className="text-white/40">|</span>
            <Link
              href="/en"
              className={locale === 'en' ? 'text-brand-gold' : 'text-white hover:text-brand-gold transition-colors'}
              onClick={() => setIsOpen(false)}
            >
              EN
            </Link>
          </div>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="flex gap-4">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-brand-gold transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <SocialIconMobile platform={social.platform} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
