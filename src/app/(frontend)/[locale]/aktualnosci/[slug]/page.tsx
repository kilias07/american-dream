import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Media, Post } from '@/payload-types'
import { locales, defaultLocale, type Locale } from '@/config/locales'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { localizedAlternates } from '@/utilities/seo'

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

async function getPost(slug: string, locale: Locale): Promise<Post | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      locale,
      fallbackLocale: defaultLocale,
      depth: 2,
      limit: 1,
    })
    return (result.docs[0] as Post) ?? null
  } catch {
    return null
  }
}

async function getRelatedPosts(currentId: number, locale: Locale): Promise<Post[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'posts',
      where: {
        and: [{ _status: { equals: 'published' } }, { id: { not_equals: currentId } }],
      },
      sort: '-publishedAt',
      locale,
      fallbackLocale: defaultLocale,
      depth: 1,
      limit: 3,
    })
    return result.docs as Post[]
  } catch {
    return []
  }
}

// Adjacent articles by publish date: `prev` = newer post, `next` = older post.
async function getAdjacentPosts(
  publishedAt: string | null | undefined,
  currentId: number,
  locale: Locale,
): Promise<{ prev: Post | null; next: Post | null }> {
  if (!publishedAt) return { prev: null, next: null }
  try {
    const payload = await getPayload({ config: configPromise })
    const [newer, older] = await Promise.all([
      payload.find({
        collection: 'posts',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { id: { not_equals: currentId } },
            { publishedAt: { greater_than: publishedAt } },
          ],
        },
        sort: 'publishedAt',
        locale,
        fallbackLocale: defaultLocale,
        depth: 0,
        limit: 1,
      }),
      payload.find({
        collection: 'posts',
        where: {
          and: [
            { _status: { equals: 'published' } },
            { id: { not_equals: currentId } },
            { publishedAt: { less_than: publishedAt } },
          ],
        },
        sort: '-publishedAt',
        locale,
        fallbackLocale: defaultLocale,
        depth: 0,
        limit: 1,
      }),
    ])
    return {
      prev: (newer.docs[0] as Post) ?? null,
      next: (older.docs[0] as Post) ?? null,
    }
  } catch {
    return { prev: null, next: null }
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params

  const cachedGetPost = unstable_cache(() => getPost(slug, locale as Locale), [`post-${slug}-${locale}`], {
    tags: [`post-${slug}`, 'posts'],
  })

  const post = await cachedGetPost()

  if (!post) {
    notFound()
  }

  const cachedRelated = unstable_cache(
    () => getRelatedPosts(post.id, locale as Locale),
    [`post-related-${post.id}-${locale}`],
    { tags: ['posts'] },
  )
  const related = await cachedRelated()

  const cachedAdjacent = unstable_cache(
    () => getAdjacentPosts(post.publishedAt, post.id, locale as Locale),
    [`post-adjacent-${post.id}-${locale}`],
    { tags: ['posts'] },
  )
  const { prev, next } = await cachedAdjacent()

  const hero = isMedia(post.heroImage) ? post.heroImage : null
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="bg-brand-navy text-white">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-end overflow-hidden">
        {hero?.url ? (
          <Image
            src={hero.url}
            alt={hero.alt || post.title}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-navy-royal" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/20" />

        <div className="relative w-full max-w-[860px] mx-auto px-6 md:px-10 pb-12 md:pb-16">
          <Link
            href={`/${locale}/aktualnosci`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-brand-gold text-[11px] font-bold uppercase tracking-[0.14em] mb-5 transition-colors"
          >
            <span aria-hidden>‹</span>
            {locale === 'pl' ? 'Wróć' : 'Back'}
          </Link>
          {publishedDate && (
            <p className="text-brand-gold text-[12px] font-bold uppercase tracking-[0.16em] mb-3">
              {publishedDate}
            </p>
          )}
          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight">{post.title}</h1>
        </div>
      </section>

      {/* Prev / next article navigation */}
      {(prev || next) && (
        <section className="border-b border-white/10">
          <div className="max-w-[860px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between gap-4">
            {prev ? (
              <Link
                href={`/${locale}/aktualnosci/${prev.slug}`}
                className="group inline-flex items-center gap-2 text-white/80 hover:text-brand-gold text-[11px] font-bold uppercase tracking-[0.14em] transition-colors max-w-[45%]"
              >
                <span aria-hidden>‹</span>
                <span className="truncate">{locale === 'pl' ? 'Poprzednie' : 'Previous'}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/${locale}/aktualnosci/${next.slug}`}
                className="group inline-flex items-center gap-2 text-white/80 hover:text-brand-gold text-[11px] font-bold uppercase tracking-[0.14em] transition-colors max-w-[45%] text-right"
              >
                <span className="truncate">{locale === 'pl' ? 'Następne' : 'Next'}</span>
                <span aria-hidden>›</span>
              </Link>
            ) : (
              <span />
            )}
          </div>
        </section>
      )}

      {/* Body */}
      <section className="py-12 md:py-16">
        <article className="max-w-[720px] mx-auto px-6 md:px-10">
          <div className="prose prose-invert max-w-none text-white/85">
            <RichTextRenderer content={post.content} />
          </div>
        </article>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="py-12 md:py-16 bg-brand-navy-royal">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 uppercase">
              {locale === 'pl' ? 'Zobacz również' : 'Related news'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rp) => {
                const img = isMedia(rp.heroImage) ? rp.heroImage : null
                return (
                  <Link
                    key={rp.id}
                    href={`/${locale}/aktualnosci/${rp.slug}`}
                    className="group relative rounded-2xl overflow-hidden bg-brand-navy flex flex-col"
                    style={{ minHeight: 300 }}
                  >
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={img.alt || rp.title}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-brand-navy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-transparent" />
                    <div className="relative mt-auto p-5">
                      <h3 className="text-white text-base font-bold uppercase tracking-wide leading-tight mb-1">
                        {rp.title}
                      </h3>
                      {rp.excerpt && (
                        <p className="text-white/70 text-sm leading-relaxed line-clamp-2">{rp.excerpt}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config: configPromise })
    const posts = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      pagination: false,
      select: { slug: true },
    })
    return posts.docs
      .filter((p) => p.slug)
      .flatMap((p) => locales.map((locale) => ({ locale, slug: p.slug as string })))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const post = await getPost(slug, locale as Locale)

  if (!post) return {}

  const ogImage = isMedia(post.meta?.image)
    ? post.meta.image
    : isMedia(post.heroImage)
      ? post.heroImage
      : null

  return {
    title: post.meta?.title ?? post.title,
    description: post.meta?.description ?? post.excerpt ?? undefined,
    alternates: localizedAlternates(locale, `aktualnosci/${slug}`),
    openGraph: {
      type: 'article',
      title: post.meta?.title ?? post.title ?? undefined,
      description: post.meta?.description ?? post.excerpt ?? undefined,
      ...(ogImage?.url ? { images: [{ url: ogImage.url }] } : {}),
    },
  }
}
