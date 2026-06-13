import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type {
  RecurringSeriesTeaserBlock as RecurringSeriesTeaserBlockType,
  Media,
  RecurringSery,
} from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'

function isMedia(value: Media | number | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

function isSeries(value: number | RecurringSery): value is RecurringSery {
  return typeof value === 'object' && value !== null
}

const THEME_ACCENT: Record<NonNullable<RecurringSery['themeColor']>, string> = {
  amber: '#F8AB00',
  blackwhite: '#FFFFFF',
  sepia: '#C9A06A',
  purple: '#8B5CF6',
}

async function getSeries(
  block: RecurringSeriesTeaserBlockType,
  locale: string,
): Promise<RecurringSery[]> {
  const selected = (block.series ?? []).filter(isSeries)
  if (selected.length > 0) return selected

  try {
    const payload = await getPayload({ config: configPromise })
    const { docs } = await payload.find({
      collection: 'recurring-series',
      locale: locale as 'pl' | 'en',
      depth: 1,
      limit: 100,
    })
    return docs
  } catch {
    return []
  }
}

function SeriesCard({ series, locale }: { series: RecurringSery; locale: string }) {
  const wordmark = isMedia(series.wordmarkImage) ? series.wordmarkImage : null
  const hero = isMedia(series.heroImage) ? series.heroImage : null
  const bg = wordmark ?? hero
  const accent = series.themeColor ? THEME_ACCENT[series.themeColor] : '#F8AB00'

  return (
    <Link
      href={localeHref(locale as Locale, `/wydarzenia-cykliczne/${series.slug}`)}
      className="group relative flex flex-col justify-end rounded-2xl overflow-hidden min-h-[280px] md:min-h-[320px]"
    >
      {/* Background */}
      {bg?.url ? (
        <Image
          src={bg.url}
          alt={bg.alt || series.name}
          fill
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div className="absolute inset-0 bg-brand-navy-royal" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/50 to-transparent" />

      {/* Accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative p-6 z-10">
        <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wide mb-2">
          {series.name}
        </h3>
        {series.description && (
          <p className="text-white/70 text-sm leading-relaxed line-clamp-2 mb-4">
            {series.description}
          </p>
        )}
        <span
          className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em]"
          style={{ color: accent }}
        >
          {locale === 'pl' ? 'Czytaj więcej' : 'Read more'}
          <span aria-hidden="true">›</span>
        </span>
      </div>
    </Link>
  )
}

export async function RecurringSeriesTeaserBlock({
  block,
  locale,
}: {
  block: RecurringSeriesTeaserBlockType
  locale: string
}) {
  const { eyebrow, heading, description } = block
  const series = await getSeries(block, locale)

  if (series.length === 0) return null

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {(eyebrow || heading || description) && (
          <div className="mb-8 max-w-2xl">
            {eyebrow && (
              <p className="text-brand-gold text-[12px] font-bold uppercase tracking-[0.18em] mb-2">
                {eyebrow}
              </p>
            )}
            {heading && (
              <h2 className="text-white font-serif text-3xl md:text-4xl font-bold uppercase tracking-tight mb-3">
                {heading}
              </h2>
            )}
            {description && (
              <p className="text-white/70 text-sm md:text-base leading-relaxed">{description}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  )
}
