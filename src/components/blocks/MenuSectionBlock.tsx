import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { MenuSectionBlock as MenuSectionBlockType, MenuItem, MenuCategory, Media } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { getUILabels, pick } from '@/lib/ui-labels'
import { ui as uiText } from '@/config/ui-strings'

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

/**
 * The club's printed cigar card, rebuilt from the CMS.
 *
 * This mirrors the graphic the client had been uploading as a flat image: a
 * warm smoke-brown panel inside a thin gold rule, section and category names in
 * pale sand badges, item names in bold white with the price set quietly to the
 * right. The point of rebuilding it rather than linking a picture is that the
 * text is now editable, translatable and readable to search engines — while
 * looking the same.
 */
function MenuBadge({ children, large }: { children: React.ReactNode; large?: boolean }) {
  return (
    <span
      className={`inline-block rounded-md bg-[#F2D6A2] text-[#3B2A17] font-bold ${
        large
          ? 'px-4 py-1.5 text-lg md:text-xl uppercase tracking-[0.04em]'
          : 'px-3.5 py-1 text-base md:text-lg'
      }`}
    >
      {children}
    </span>
  )
}

function PricedList({ groups, heading }: { groups: Group[]; heading?: string | null }) {
  return (
    // Colours sampled from the printed card: a warm glow through the middle
    // falling away to near-black at the edges, inside a thin gold rule.
    <div
      className="rounded-2xl border border-[#7A5C34]/60 p-6 sm:p-9 md:p-12 shadow-2xl
                 bg-[radial-gradient(90%_75%_at_50%_45%,#35200F_0%,#291a0d_55%,#180F08_100%)]"
    >
      {heading && (
        <div className="mb-7">
          <MenuBadge large>{heading}</MenuBadge>
        </div>
      )}
      {/* Two balanced columns, as on the card: a long first category fills the
          left, the shorter ones stack on the right. `break-inside-avoid` keeps a
          category from being split across the gap. */}
      <div className="md:columns-2 md:gap-x-16 lg:gap-x-24">
        {groups.map((group) => (
          <div key={group.key} className="mb-8 break-inside-avoid">
            {group.title && (
              <div className="mb-3.5">
                <MenuBadge>{group.title}</MenuBadge>
              </div>
            )}
            <ul>
              {group.items.map((item) => {
                const price = formatPrice(item.price, item.currency)
                const sub = item.description || item.origin
                return (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-6 py-[7px]"
                  >
                    <span className="min-w-0">
                      <span className="text-[#FFF7F1] font-bold text-[15px] md:text-[17px] leading-snug">
                        {item.name}
                      </span>
                      {sub && (
                        <span className="block text-white/40 text-xs md:text-sm leading-snug">
                          {sub}
                        </span>
                      )}
                    </span>
                    {price && (
                      <span className="shrink-0 text-[#CDBBA9] text-[15px] md:text-[17px] whitespace-nowrap tabular-nums">
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

/**
 * The signature-cocktail poster, rebuilt from the CMS.
 *
 * The printed version is one full-page photograph per drink with the type set
 * over it: an orange strip naming the section, the cocktail in large display
 * letters, the pour on one side, the price in a hairline box and a tasting note
 * along the bottom. The side the type sits on alternates page to page, which is
 * what stops a run of posters feeling mechanical — so it alternates here too.
 *
 * Two things the print has that a template cannot: a different display face per
 * drink, and a photograph shot for that drink. The layout below is faithful in
 * structure and colour; give each item its own photo in Menu Items and it reads
 * as the same piece.
 */
function CocktailPoster({
  item,
  sectionLabel,
  reversed,
}: {
  item: MenuItem
  sectionLabel: string
  reversed: boolean
}) {
  const media = isMedia(item.image) ? item.image : null
  const price = formatPrice(item.price, item.currency)
  const [firstLine, ...restName] = (item.name || '').split(' ')
  const secondLine = restName.join(' ')
  const side = reversed ? 'items-start text-left' : 'items-end text-right'

  return (
    <article className="relative overflow-hidden rounded-2xl bg-black aspect-[3/4] md:aspect-[1/1.42]">
      {media?.url ? (
        <Image
          src={media.url}
          alt={media.alt || item.name}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#3a1f0a] via-brand-navy-royal to-black" />
      )}
      {/* Keeps the type legible over whatever the photograph is doing. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" />

      <div className="relative h-full flex flex-col p-5 sm:p-7 md:p-8">
        <div className={`flex ${reversed ? 'justify-start' : 'justify-end'}`}>
          <span className="bg-brand-gold text-black text-[10px] sm:text-[11px] md:text-[13px] font-bold uppercase tracking-[0.22em] px-4 sm:px-8 py-1.5">
            {sectionLabel}
          </span>
        </div>

        <div className={`mt-auto flex flex-col ${side} gap-3`}>
          <h3 className="text-white font-bold uppercase leading-[0.86] tracking-[-0.01em]">
            <span className="block text-[34px] sm:text-[46px] md:text-[54px] lg:text-[62px]">
              {firstLine}
            </span>
            {secondLine && (
              <span className="block text-[26px] sm:text-[34px] md:text-[40px] lg:text-[46px]">
                {secondLine}
              </span>
            )}
          </h3>

          {item.ingredients && (
            <ul className="text-white/90 text-[13px] sm:text-[15px] md:text-[17px] leading-[1.5]">
              {item.ingredients
                .split(/\r?\n|,\s*/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
            </ul>
          )}

          {price && (
            <span className="inline-block border border-white px-4 py-1.5 text-white text-base md:text-xl font-bold">
              {price}
            </span>
          )}
        </div>

        {item.description && (
          <div className="mt-5 border border-white/70 p-4 md:p-5">
            <p className="text-white/90 text-[12px] sm:text-[13px] md:text-[15px] leading-relaxed text-justify">
              {item.description}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}

function PosterList({ groups, sectionLabel }: { groups: Group[]; sectionLabel: string }) {
  const items = groups.flatMap((g) => g.items)
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((item, i) => (
        <CocktailPoster key={item.id} item={item} sectionLabel={sectionLabel} reversed={i % 2 === 1} />
      ))}
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
        <h3 className="text-white text-2xl md:text-3xl font-bold uppercase tracking-tight leading-tight mb-3">{item.name}</h3>
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
                <h3 className="text-white text-2xl md:text-3xl font-bold uppercase tracking-tight leading-tight mb-2">
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
    locale: locale as Locale,
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
        {/* On the card layout the heading sits inside the panel, as a badge —
            that is where the printed card puts it. */}
        {(block.sectionTag || (block.heading && block.layout !== 'pricedList' && block.layout !== 'poster')) && (
          <div className="mb-10">
            {block.sectionTag && (
              <p className="text-brand-gold text-xs md:text-sm font-bold uppercase tracking-[0.18em] mb-3">
                {block.sectionTag}
              </p>
            )}
            {block.heading && block.layout !== 'pricedList' && block.layout !== 'poster' && (
              <h2 className="text-white text-3xl md:text-4xl font-bold uppercase tracking-tight leading-tight">
                {block.heading}
              </h2>
            )}
          </div>
        )}

        {block.layout === 'poster' ? (
          <PosterList groups={groups} sectionLabel={block.heading || ''} />
        ) : block.layout === 'cardGrid' ? (
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
              <PricedList groups={groups} heading={block.heading} />
            </div>
          </div>
        ) : (
          <PricedList groups={groups} heading={block.heading} />
        )}

        {pdfHref && (
          <div className="mt-10">
            <Link
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors"
            >
              {pick(ui?.menu?.fullMenuPdf, uiText(locale as Locale).seeFullMenuPdf)}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
