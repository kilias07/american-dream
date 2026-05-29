import React from 'react'
import Link from 'next/link'
import type { Notice21PlusBlock as Notice21PlusBlockType } from '@/payload-types'

export function Notice21PlusBlock({
  block,
  locale,
}: {
  block: Notice21PlusBlockType
  locale: string
}) {
  const { heading, body, ctaLabel, ctaUrl } = block

  if (!heading && !body && !ctaLabel) return null

  const ctaHref = ctaUrl
    ? ctaUrl.startsWith('/')
      ? `/${locale}${ctaUrl}`
      : ctaUrl
    : null

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-5">
          {/* 21+ badge */}
          <div className="w-16 h-16 rounded-full border-2 border-brand-gold text-brand-gold flex items-center justify-center font-bold text-lg">
            21+
          </div>

          {heading && (
            <h2 className="font-serif text-white text-2xl md:text-3xl leading-tight">{heading}</h2>
          )}

          {body && <p className="text-white/70 text-base md:text-lg leading-relaxed">{body}</p>}

          {ctaLabel && ctaHref && (
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 border border-white text-white text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-white hover:text-brand-navy transition-colors"
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
