import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { NewsCarouselBlock as NewsCarouselBlockType, Post, Media } from '@/payload-types'
import { NewsCarouselClient } from './NewsCarouselClient'
import type { NewsCard } from './NewsCarouselClient'

function isMedia(value: Media | number | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

export async function NewsCarouselBlock({
  block,
  locale,
}: {
  block: NewsCarouselBlockType
  locale: string
}) {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      _status: { equals: 'published' },
    },
    sort: '-publishedAt',
    limit: block.limit || 3,
    locale: locale as 'pl' | 'en' | 'all',
    depth: 1,
  })

  const posts = docs as Post[]
  if (posts.length === 0) return null

  const cards: NewsCard[] = posts.map((post) => {
    const hero = isMedia(post.heroImage) ? post.heroImage : null
    return {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt ?? null,
      slug: post.slug,
      image: hero?.url ? { url: hero.url, alt: hero.alt || post.title } : null,
    }
  })

  const heading = block.heading || (locale === 'pl' ? 'AKTUALNOŚCI' : 'NEWS')

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            {block.eyebrow && (
              <p className="text-brand-gold text-xs md:text-sm font-bold uppercase tracking-[0.18em] mb-2">
                {block.eyebrow}
              </p>
            )}
            <h2 className="font-serif text-white text-3xl md:text-5xl leading-tight">{heading}</h2>
          </div>

          {block.viewAllLabel && block.viewAllUrl && (
            <Link
              href={block.viewAllUrl.startsWith('/') ? `/${locale}${block.viewAllUrl}` : block.viewAllUrl}
              className="hidden md:inline-flex flex-shrink-0 items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors whitespace-nowrap"
            >
              {block.viewAllLabel}
            </Link>
          )}
        </div>

        <NewsCarouselClient cards={cards} locale={locale} />

        {block.viewAllLabel && block.viewAllUrl && (
          <div className="mt-6 flex justify-center md:hidden">
            <Link
              href={block.viewAllUrl.startsWith('/') ? `/${locale}${block.viewAllUrl}` : block.viewAllUrl}
              className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors"
            >
              {block.viewAllLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
