import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { PageHeroBlock as PageHeroBlockType, Media } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

export function PageHeroBlock({
  block,
  locale,
  headingLevel = 'h1',
}: {
  block: PageHeroBlockType
  locale: string
  headingLevel?: 'h1' | 'h2'
}) {
  const { eyebrow, title, titleStyle, body, backgroundImage, inlineLinkLabel, inlineLinkUrl } =
    block

  if (!title) return null

  const Heading = headingLevel

  const image = isMedia(backgroundImage) ? backgroundImage : null
  const inlineHref = inlineLinkUrl
    ? inlineLinkUrl.startsWith('/')
      ? localeHref(locale as Locale, inlineLinkUrl)
      : inlineLinkUrl
    : null

  return (
    /* Uwaga klienta 2026-07: hero niższe (~48vh, było 70vh); tekst spod hero
       przeniesiony NA hero (pole `body` pod tytułem). */
    <section className="relative min-h-[48vh] flex flex-col justify-end overflow-hidden">
      {/* Background image */}
      {image?.url ? (
        <Image
          src={image.url}
          alt={image.alt || title}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      ) : (
        /* Brand gradient fallback — replaced by a real photo via CMS */
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-navy-royal to-[#0e1a4a]" />
      )}

      {/* Dark navy overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/50 to-brand-navy/20" />

      {/* Content - bottom left */}
      <div className="relative z-10 container max-w-[1280px] mx-auto px-6 md:px-10 pb-10 md:pb-12 pt-32">
        {/* Eyebrow — biały/neutralny (uwaga klienta: „obecnie żółte, a nie powinno być") */}
        {eyebrow && (
          <p className="text-white/80 text-xs md:text-sm font-bold uppercase tracking-[0.18em] mb-3">
            {eyebrow}
          </p>
        )}

        <Heading
          className={
            titleStyle === 'serif'
              ? 'font-serif text-white text-4xl md:text-6xl leading-tight'
              : 'text-white text-3xl md:text-5xl font-bold uppercase tracking-tight leading-tight'
          }
        >
          {title}
        </Heading>

        {/* Body — akapit opisu na hero (przeniesiony spod hero) */}
        {body && (
          <p className="mt-5 max-w-3xl text-white/90 text-sm md:text-base leading-relaxed border border-white/25 rounded-xl px-5 py-4 bg-brand-navy/30 backdrop-blur-[2px]">
            {body}
          </p>
        )}

        {inlineLinkLabel && inlineHref && (
          <Link
            href={inlineHref}
            className="inline-flex items-center gap-1.5 mt-5 text-brand-gold text-sm font-bold uppercase tracking-[0.12em] hover:text-brand-gold-dark transition-colors"
          >
            {inlineLinkLabel}
            <span aria-hidden>›</span>
          </Link>
        )}
      </div>

      {/* Thin gold divider rule under the hero */}
      <div className="relative z-10 h-px w-full bg-brand-gold" />
    </section>
  )
}
