import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { SpecialMenuBlock as SpecialMenuBlockType, Media } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { localeHref } from '@/utilities/href'
import { getUILabels, pick } from '@/lib/ui-labels'

function isMedia(value: number | Media | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

type Dietary = 'none' | 'v' | 'vg' | 'pair' | null | undefined

/** Small navy badge denoting a dish's dietary attribute (V / VG / for two). */
function DietaryIcon({ kind }: { kind: Dietary }) {
  if (!kind || kind === 'none') return null
  const base =
    'inline-flex items-center justify-center align-middle h-[18px] min-w-[18px] px-1 rounded-full bg-brand-navy text-brand-gold text-[10px] font-bold leading-none'
  if (kind === 'pair') {
    return (
      <span className={base} aria-label="danie dla dwóch osób" title="danie dla dwóch osób">
        <PairGlyph />
      </span>
    )
  }
  return (
    <span className={base} aria-label={kind === 'vg' ? 'danie wegańskie' : 'danie wegetariańskie'}>
      {kind === 'vg' ? 'VG' : 'V'}
    </span>
  )
}

function PairGlyph() {
  return (
    <svg width="15" height="10" viewBox="0 0 30 20" fill="currentColor" aria-hidden="true">
      <circle cx="8" cy="5.5" r="4.5" />
      <circle cx="22" cy="5.5" r="4.5" />
      <path d="M0 20c0-4.6 3.6-8 8-8s8 3.4 8 8Z" />
      <path d="M14 20c0-4.6 3.6-8 8-8s8 3.4 8 8Z" />
    </svg>
  )
}

export async function SpecialMenuBlock({
  block,
  locale,
}: {
  block: SpecialMenuBlockType
  locale: string
}) {
  const { heading, subtitle, body, ctaLabel, ctaUrl, categories, notice } = block
  const image = isMedia(block.image) ? block.image : null
  const logo = isMedia(block.logo) ? block.logo : null

  if (!heading && !categories?.length) return null

  const ctaHref = ctaUrl
    ? ctaUrl.startsWith('/')
      ? localeHref(locale as Locale, ctaUrl)
      : ctaUrl
    : null
  const ctaClass =
    'inline-flex items-center justify-center gap-2 bg-white text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-7 py-3.5 rounded-full hover:bg-white/90 transition-colors'

  const cats = categories ?? []
  const leftCats = cats.filter((c) => c.column !== 'right')
  const rightCats = cats.filter((c) => c.column === 'right')

  const ui = await getUILabels(locale as Locale)
  const fallbackLegend =
    locale === 'en'
      ? { pair: 'dish for two', v: 'vegetarian dish', vg: 'vegan dish' }
      : { pair: 'danie dla dwóch osób', v: 'danie wegetariańskie', vg: 'danie wegańskie' }
  const legend = {
    pair: pick(ui?.menu?.legendPair, fallbackLegend.pair),
    v: pick(ui?.menu?.legendVeg, fallbackLegend.v),
    vg: pick(ui?.menu?.legendVegan, fallbackLegend.vg),
  }

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="rounded-3xl overflow-hidden bg-brand-gold text-brand-navy ring-1 ring-brand-gold-dark">
          {/* ── Banner: gold-duotone photo + logo/heading, intro and CTA ── */}
          <div className="relative">
            {image?.url && (
              <Image
                src={image.url}
                alt={image.alt || heading || ''}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1280px) 100vw, 1200px"
              />
            )}
            {/* Warm amber duotone: recolor to gold + a gold flood so the banner stays
                bright (design), then only a soft bottom-left navy wash for white copy. */}
            <div className="absolute inset-0 bg-brand-gold mix-blend-color" />
            <div className="absolute inset-0 bg-brand-gold/35" />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-navy/45 via-transparent to-transparent" />

            <div className="relative flex flex-col p-8 md:p-12">
              {/* Logo + intro grouped together, top-left (design). */}
              <div className="max-w-xl">
                {logo?.url ? (
                  <Image
                    src={logo.url}
                    alt={logo.alt || heading || ''}
                    width={logo.width || 360}
                    height={logo.height || 160}
                    className="h-auto w-56 md:w-72"
                  />
                ) : (
                  heading && (
                    <h2 className="font-serif italic text-brand-navy text-5xl md:text-6xl leading-[0.95] drop-shadow-sm">
                      {heading}
                    </h2>
                  )
                )}

                {subtitle && (
                  <p className="text-white text-lg md:text-xl font-semibold mt-8 drop-shadow">{subtitle}</p>
                )}
                {body && (
                  <p className="text-white/90 text-sm md:text-base leading-relaxed mt-4 drop-shadow">
                    {body}
                  </p>
                )}
              </div>

              {/* CTA — lower-right over the photo on desktop, stacked on mobile. */}
              {ctaLabel && (
                <div className="mt-8 md:mt-0 md:absolute md:right-12 md:bottom-12">
                  {ctaHref ? (
                    <Link href={ctaHref} className={ctaClass}>
                      {ctaLabel}
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* ── Priced menu: two columns of categories ── */}
          {cats.length > 0 && (
            <div className="px-8 md:px-12 pt-8 md:pt-10 pb-8">
              <div className="grid md:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-2">
                <div className="space-y-7">
                  {leftCats.map((cat, i) => (
                    <CategoryColumn key={cat.id || `l-${i}`} category={cat} />
                  ))}
                </div>
                <div className="space-y-7">
                  {rightCats.map((cat, i) => (
                    <CategoryColumn key={cat.id || `r-${i}`} category={cat} align="right" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Legend + fine print ── */}
          {(cats.length > 0 || notice) && (
            <div className="px-8 md:px-12 pb-10 md:pb-12">
              <div className="border-t border-brand-navy/20 pt-6 grid md:grid-cols-2 gap-6">
                <ul className="flex flex-col gap-2 text-sm font-semibold">
                  <li className="flex items-center gap-2">
                    <DietaryIcon kind="pair" /> {legend.pair}
                  </li>
                  <li className="flex items-center gap-2">
                    <DietaryIcon kind="v" /> {legend.v}
                  </li>
                  <li className="flex items-center gap-2">
                    <DietaryIcon kind="vg" /> {legend.vg}
                  </li>
                </ul>
                {notice && (
                  <p className="text-brand-navy/70 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                    {notice}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

type Category = NonNullable<SpecialMenuBlockType['categories']>[number]

function CategoryColumn({ category, align }: { category: Category; align?: 'right' }) {
  const items = category.items ?? []
  const isRight = align === 'right'
  return (
    <div>
      {category.title && (
        <div className={isRight ? 'flex md:justify-end' : ''}>
          {/* Tab anchored to the panel edge: negative margin cancels the panel's
              padding so the badge touches the edge, inner padding keeps the text
              aligned with the dishes. */}
          <span
            className={`inline-block bg-brand-navy text-brand-gold text-xs md:text-sm font-bold uppercase tracking-[0.14em] py-1.5 ${
              isRight
                ? 'pl-4 pr-8 md:pr-12 -mr-8 md:-mr-12 rounded-l'
                : 'pr-4 pl-8 md:pl-12 -ml-8 md:-ml-12 rounded-r'
            }`}
          >
            {category.title}
          </span>
        </div>
      )}
      <ul className="mt-4 space-y-4">
        {items.map((item, j) => (
          <li key={item.id || j}>
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-bold uppercase tracking-wide text-base md:text-[17px] flex items-center gap-2">
                <span>{item.name}</span>
                <DietaryIcon kind={item.dietary as Dietary} />
              </p>
              {typeof item.price === 'number' && (
                <span className="shrink-0 font-bold whitespace-nowrap tabular-nums text-base md:text-[17px]">{item.price} zł</span>
              )}
            </div>
            {item.ingredients && (
              <p className="text-brand-navy/70 text-xs md:text-sm leading-snug mt-1">{item.ingredients}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
