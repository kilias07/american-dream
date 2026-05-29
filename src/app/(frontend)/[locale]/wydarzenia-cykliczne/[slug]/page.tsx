import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { Media, RecurringSery } from '@/payload-types'
import { locales, defaultLocale, type Locale } from '@/config/locales'
import { localizedAlternates } from '@/utilities/seo'

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

const ACCENT: Record<NonNullable<RecurringSery['themeColor']>, string> = {
  amber: '#F8AB00',
  blackwhite: '#FFFFFF',
  sepia: '#C9A66B',
  purple: '#9D6BD8',
}

async function getSeries(slug: string, locale: Locale): Promise<RecurringSery | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'recurring-series',
      where: { slug: { equals: slug } },
      locale,
      fallbackLocale: defaultLocale,
      depth: 2,
      limit: 1,
    })
    return (result.docs[0] as RecurringSery) ?? null
  } catch {
    return null
  }
}

async function getOtherSeries(currentId: number, locale: Locale): Promise<RecurringSery[]> {
  try {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'recurring-series',
      where: { id: { not_equals: currentId } },
      locale,
      fallbackLocale: defaultLocale,
      depth: 1,
      limit: 6,
    })
    return result.docs as RecurringSery[]
  } catch {
    return []
  }
}

export default async function RecurringSeriesPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params

  const cachedGetSeries = unstable_cache(
    () => getSeries(slug, locale as Locale),
    [`series-${slug}-${locale}`],
    { tags: [`series-${slug}`, 'recurring-series'] },
  )

  const series = await cachedGetSeries()

  if (!series) {
    notFound()
  }

  const cachedOthers = unstable_cache(
    () => getOtherSeries(series.id, locale as Locale),
    [`series-others-${series.id}-${locale}`],
    { tags: ['recurring-series'] },
  )
  const others = await cachedOthers()

  const accent = ACCENT[series.themeColor ?? 'amber']
  const hero = isMedia(series.heroImage) ? series.heroImage : null
  const wordmark = isMedia(series.wordmarkImage) ? series.wordmarkImage : null
  const gallery = (series.gallery ?? []).filter((g) => isMedia(g.image))

  return (
    <div className="bg-brand-navy text-white">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center text-center overflow-hidden">
        {hero?.url ? (
          <Image
            src={hero.url}
            alt={hero.alt || series.name}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-navy-royal" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/40" />

        <div className="relative w-full max-w-[860px] mx-auto px-6 md:px-10 py-16">
          {series.eyebrow && (
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em] mb-4"
              style={{ color: accent }}
            >
              {series.eyebrow}
            </p>
          )}

          {wordmark?.url ? (
            <div className="relative w-full max-w-md mx-auto h-32 md:h-44 mb-6">
              <Image
                src={wordmark.url}
                alt={wordmark.alt || series.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 90vw, 448px"
              />
            </div>
          ) : (
            <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6">{series.name}</h1>
          )}

          {series.description && (
            <p className="text-white/85 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              {series.description}
            </p>
          )}
        </div>
      </section>

      {/* Gallery */}
      {gallery.length > 0 && (
        <section className="py-12 md:py-16">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map((g, i) => {
                const media = g.image as Media
                return (
                  <div
                    key={g.id ?? i}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-brand-navy-royal"
                  >
                    <Image
                      src={media.url as string}
                      alt={media.alt || g.caption || series.name}
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    {g.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-navy/90 to-transparent p-3">
                        <p className="text-white/85 text-xs">{g.caption}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Other series */}
      {others.length > 0 && (
        <section className="py-12 md:py-16 bg-brand-navy-royal">
          <div className="max-w-[1280px] mx-auto px-6 md:px-10">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 uppercase">
              {locale === 'pl' ? 'Pozostałe wydarzenia cykliczne' : 'Other recurring series'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {others.map((s) => {
                const img = isMedia(s.heroImage)
                  ? s.heroImage
                  : isMedia(s.wordmarkImage)
                    ? s.wordmarkImage
                    : null
                const sAccent = ACCENT[s.themeColor ?? 'amber']
                return (
                  <Link
                    key={s.id}
                    href={`/${locale}/wydarzenia-cykliczne/${s.slug}`}
                    className="group relative rounded-2xl overflow-hidden bg-brand-navy flex flex-col"
                    style={{ minHeight: 280 }}
                  >
                    {img?.url ? (
                      <Image
                        src={img.url}
                        alt={img.alt || s.name}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-brand-navy" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent" />
                    <div className="relative mt-auto p-5">
                      {s.eyebrow && (
                        <p
                          className="text-[10px] font-bold uppercase tracking-[0.16em] mb-1"
                          style={{ color: sAccent }}
                        >
                          {s.eyebrow}
                        </p>
                      )}
                      <h3 className="text-white text-lg font-bold uppercase tracking-wide leading-tight">
                        {s.name}
                      </h3>
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
    const series = await payload.find({
      collection: 'recurring-series',
      pagination: false,
      select: { slug: true },
    })
    return series.docs
      .filter((s) => s.slug)
      .flatMap((s) => locales.map((locale) => ({ locale, slug: s.slug as string })))
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
  const series = await getSeries(slug, locale as Locale)

  if (!series) return {}

  const ogImage = isMedia(series.heroImage)
    ? series.heroImage
    : isMedia(series.wordmarkImage)
      ? series.wordmarkImage
      : null

  return {
    title: series.name,
    description: series.description ?? undefined,
    alternates: localizedAlternates(locale, `wydarzenia-cykliczne/${slug}`),
    openGraph: {
      title: series.name ?? undefined,
      description: series.description ?? undefined,
      ...(ogImage?.url ? { images: [{ url: ogImage.url }] } : {}),
    },
  }
}
