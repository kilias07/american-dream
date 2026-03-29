import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Media, Page } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/Header/Logo'

type HeroBannerData = Extract<NonNullable<Page['layout']>[number], { blockType: 'heroBanner' }>

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

const IconMap = ({ icon }: { icon: string }) => {
  switch (icon) {
    case 'fork':
      return (
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11 2v7H9V2H7v7H5V2H3v8c0 2.1 1.4 3.8 3.3 4.4V22h2.4v-7.6C10.6 13.8 12 12.1 12 10V2h-1zm9 0c-2.8 0-5 2.2-5 5v5h2v10h2.5V2H20z" />
        </svg>
      )
    case 'music':
      return (
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      )
    case 'ticket':
      return (
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46 0-1.48-.8-2.77-2-3.46V6h16v2.54z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
        </svg>
      )
    default:
      return null
  }
}

export function HeroBannerBlock({ block, locale }: { block: HeroBannerData; locale?: string }) {
  const { heading, subtext, backgroundImage } = block
  const secondaryLinks = (block as any).secondaryLinks as Array<{ link: any; icon: string }> | undefined
  const ctaLink = (block as any).ctaLink as any
  const ctaIcon = (block as any).ctaIcon as string | undefined
  const image = isMedia(backgroundImage) ? backgroundImage : null

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center text-center text-white overflow-hidden">
      {/* Background image */}
      {image?.url ? (
        <Image
          src={image.url}
          alt={image.alt || ''}
          fill
          className="object-cover object-center"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy" />
      )}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-brand-navy/65" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-3xl mx-auto">
        {/* Logo */}
        <Link href={`/${locale ?? ''}`} className="block mb-2">
          <Logo className="h-24 w-auto" />
        </Link>

        {/* Heading */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-wide leading-tight">
          {heading}
        </h1>

        {/* Subtext */}
        {subtext && (
          <p className="text-lg md:text-xl text-white/90 max-w-xl">
            {subtext}
          </p>
        )}

        {/* Secondary outline buttons */}
        {secondaryLinks && secondaryLinks.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            {secondaryLinks.map((item, i) => (
              <CMSLink
                key={i}
                {...item.link}
                locale={locale}
                className="inline-flex items-center gap-2 border border-white/70 text-white px-6 py-2.5 rounded-full text-[13px] font-semibold uppercase tracking-[0.12em] hover:border-white hover:bg-white/10 transition-all"
              >
                {item.icon && item.icon !== 'none' && <IconMap icon={item.icon} />}
              </CMSLink>
            ))}
          </div>
        )}

        {/* CTA gold button */}
        {ctaLink?.label && (
          <CMSLink
            {...ctaLink}
            locale={locale}
            className="inline-flex items-center gap-2.5 bg-brand-gold text-white px-8 py-3 rounded-full text-[13px] font-bold uppercase tracking-[0.12em] hover:bg-brand-gold-dark transition-colors shadow-lg"
          >
            {ctaIcon && ctaIcon !== 'none' && <IconMap icon={ctaIcon} />}
          </CMSLink>
        )}
      </div>
    </section>
  )
}
