import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { MenuSectionBlock as MenuSectionBlockType, MenuItem, MenuCategory, Media } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { getUILabels, pick } from '@/lib/ui-labels'

function isMedia(value: Media | number | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

function isCategory(value: MenuCategory | number | null | undefined): value is MenuCategory {
  return typeof value === 'object' && value !== null
}

function formatPrice(price?: number | null, currency?: string | null): string | null {
  if (price == null) return null
  const unit = currency || 'zł'
  return `${price} ${unit}`
}

type Group = { key: string; title: string | null; items: MenuItem[] }

function groupItems(items: MenuItem[], groupByCategory: boolean): Group[] {
  if (!groupByCategory) {
    return [{ key: 'all', title: null, items }]
  }

  const groups = new Map<string, Group>()
  for (const item of items) {
    const cat = isCategory(item.category) ? item.category : null
    const key = cat ? `cat-${cat.id}` : 'uncategorized'
    if (!groups.has(key)) {
      groups.set(key, { key, title: cat?.title ?? null, items: [] })
    }
    groups.get(key)!.items.push(item)
  }
  return Array.from(groups.values())
}

function PricedList({ groups }: { groups: Group[] }) {
  return (
    // Warm smoky card (evokes the PDF). Groups flow into 2 balanced columns:
    // a tall first group fills the left column, the rest stack on the right —
    // matching the PDF (Nikaragua left | Dominikana + Kuba right).
    <div className="rounded-3xl bg-gradient-to-br from-[#3a2412] via-brand-navy-royal to-brand-navy p-6 md:p-10 lg:p-12 shadow-2xl ring-1 ring-white/10">
      <div className="md:columns-2 md:gap-x-14 lg:gap-x-20">
        {groups.map((group) => (
          <div key={group.key} className="mb-9 break-inside-avoid">
            {group.title && (
              <h3 className="font-serif text-brand-gold text-xl md:text-2xl mb-4 pb-2 border-b border-brand-gold/40">
                {group.title}
              </h3>
            )}
            <ul className="space-y-3">
              {group.items.map((item) => {
                const price = formatPrice(item.price, item.currency)
                const sub = item.description || item.origin
                return (
                  <li key={item.id} className="flex items-baseline justify-between gap-4">
                    <span className="min-w-0">
                      <span className="text-white text-base md:text-[17px]">{item.name}</span>
                      {sub && (
                        <span className="block text-white/45 text-xs md:text-sm leading-snug">
                          {sub}
                        </span>
                      )}
                    </span>
                    {price && (
                      <span className="shrink-0 text-brand-gold font-semibold text-base md:text-[17px] whitespace-nowrap tabular-nums">
                        {price}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function CocktailCard({ item, reversed }: { item: MenuItem; reversed: boolean }) {
  const media = isMedia(item.image) ? item.image : null
  const price = formatPrice(item.price, item.currency)
  return (
    <div
      className={`flex flex-col ${
        reversed ? 'md:flex-row-reverse' : 'md:flex-row'
      } bg-brand-navy-royal rounded-2xl overflow-hidden`}
    >
      <div className="relative w-full md:w-1/2 aspect-[4/3] md:aspect-auto md:min-h-[320px] flex-shrink-0">
        {media?.url ? (
          <Image
            src={media.url}
            alt={media.alt || item.name}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#3a1f0a] via-brand-navy-royal to-brand-navy" />
        )}
        {item.tag && (
          <span className="absolute top-5 left-5 bg-brand-gold text-brand-navy text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full">
            {item.tag}
          </span>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center p-6 md:p-10">
        <h3 className="font-serif text-white text-2xl md:text-4xl leading-tight mb-3">{item.name}</h3>
        {item.ingredients && (
          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-4">{item.ingredients}</p>
        )}
        {price && (
          <span className="self-start border border-brand-gold/60 text-brand-gold text-sm font-bold px-4 py-1.5 rounded-full">
            {price}
          </span>
        )}
        {item.description && item.description !== item.ingredients && (
          <p className="text-white/55 text-sm leading-relaxed border-t border-white/10 pt-4 mt-5">
            {item.description}
          </p>
        )}
      </div>
    </div>
  )
}

function CardGrid({ groups, cocktails }: { groups: Group[]; cocktails?: boolean }) {
  // Cocktail bar: full-width alternating split cards (image one side, details the
  // other), with ingredient list + a separate description below — matches the design.
  if (cocktails) {
    const items = groups.flatMap((g) => g.items)
    return (
      <div className="space-y-6 md:space-y-8">
        {items.map((item, i) => (
          <CocktailCard key={item.id} item={item} reversed={i % 2 === 1} />
        ))}
      </div>
    )
  }
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <div key={group.key}>
          {group.title && (
            <h3 className="text-brand-gold text-sm font-bold uppercase tracking-[0.18em] mb-5 pb-2 border-b border-brand-gold/30">
              {group.title}
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {group.items.map((item) => {
        const media = isMedia(item.image) ? item.image : null
        const price = formatPrice(item.price, item.currency)
        const sub = item.ingredients || item.description
        return (
          <div
            key={item.id}
            className="relative rounded-2xl overflow-hidden bg-brand-navy-royal"
            style={{ minHeight: 300 }}
          >
            {media?.url ? (
              <Image
                src={media.url}
                alt={media.alt || item.name}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              /* Warm bar-atmosphere gradient — replaced by a real photo via CMS */
              <div className="absolute inset-0 bg-gradient-to-br from-[#3a1f0a] via-brand-navy-royal to-brand-navy" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/20" />

            <div className="relative flex flex-col h-full p-6 min-h-[300px]">
              {item.tag && (
                <span className="self-start bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full">
                  {item.tag}
                </span>
              )}

              <div className="mt-auto">
                <h3 className="font-serif text-white text-2xl md:text-3xl leading-tight mb-2">
                  {item.name}
                </h3>
                {sub && <p className="text-white/70 text-sm leading-snug mb-4">{sub}</p>}
                {price && (
                  <span className="inline-block bg-brand-gold text-brand-navy text-sm font-bold px-4 py-1.5 rounded-full">
                    {price}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
          </div>
        </div>
      ))}
    </div>
  )
}

export async function MenuSectionBlock({
  block,
  locale,
}: {
  block: MenuSectionBlockType
  locale: string
}) {
  const payload = await getPayload({ config })
  const ui = await getUILabels(locale as Locale)

  const { docs } = await payload.find({
    collection: 'menu-items',
    where: {
      menuType: { equals: block.menuType },
      available: { not_equals: false },
    },
    sort: 'order',
    locale: locale as 'pl' | 'en' | 'all',
    depth: 1,
    limit: 200,
  })

  const items = docs as MenuItem[]
  if (items.length === 0) return null

  const groupByCategory = block.groupByCategory !== false
  const groups = groupItems(items, groupByCategory)
  const pdf = isMedia(block.pdfDownload) ? block.pdfDownload : null
  const sideImage = isMedia(block.image) ? block.image : null
  // Convention: /menu/<name>.pdf served from public/menu (e.g. /menu/menu-pl.pdf).
  const pdfHref = pdf?.url || `/menu/menu-${locale}.pdf`

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {(block.sectionTag || block.heading) && (
          <div className="mb-10">
            {block.sectionTag && (
              <p className="text-brand-gold text-xs md:text-sm font-bold uppercase tracking-[0.18em] mb-3">
                {block.sectionTag}
              </p>
            )}
            {block.heading && (
              <h2 className="font-serif text-white text-3xl md:text-5xl leading-tight">
                {block.heading}
              </h2>
            )}
          </div>
        )}

        {block.layout === 'cardGrid' ? (
          <CardGrid groups={groups} cocktails={block.menuType === 'cocktails'} />
        ) : sideImage ? (
          // Design: priced list with a tall photo on the left (e.g. the cigar lounge).
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
            <div className="relative aspect-[3/4] lg:aspect-auto lg:min-h-[520px] rounded-2xl overflow-hidden">
              <Image
                src={sideImage.url || ''}
                alt={sideImage.alt || block.heading || ''}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <PricedList groups={groups} />
            </div>
          </div>
        ) : (
          <PricedList groups={groups} />
        )}

        {pdfHref && (
          <div className="mt-10">
            <Link
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors"
            >
              {pick(ui?.menu?.fullMenuPdf, locale === 'pl' ? 'Zobacz całe menu (PDF)' : 'See full menu (PDF)')}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
