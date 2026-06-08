import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { EveningPhasesBlock as EveningPhasesBlockType, Media } from '@/payload-types'

type Phase = NonNullable<EveningPhasesBlockType['phases']>[number]

function isMedia(value: Media | number | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

type OpeningDay = {
  day?: string | null
  closed?: boolean | null
  openTime?: string | null
  closeTime?: string | null
  id?: string | null
}

const DAY_LABELS_PL: Record<string, string> = {
  monday: 'Poniedziałek',
  tuesday: 'Wtorek',
  wednesday: 'Środa',
  thursday: 'Czwartek',
  friday: 'Piątek',
  saturday: 'Sobota',
  sunday: 'Niedziela',
}
const DAY_LABELS_EN: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

async function getOpenDays(): Promise<OpeningDay[]> {
  const cached = unstable_cache(
    async () => {
      try {
        const payload = await getPayload({ config: configPromise })
        const oh = await payload.findGlobal({ slug: 'opening-hours', depth: 0 })
        return (oh?.days as OpeningDay[]) ?? []
      } catch {
        return []
      }
    },
    ['evening-phases-open-days'],
    { tags: ['global_opening_hours'] },
  )
  const raw = await cached()
  return DAY_ORDER.map((d) => raw.find((od) => od.day === d))
    .filter((od): od is OpeningDay => Boolean(od))
    .filter((od) => !od.closed)
}

function PhaseCard({
  phase,
  index,
  locale,
}: {
  phase: Phase
  index: number
  locale: string
}) {
  const image = isMedia(phase.image) ? phase.image : null
  const reversed = index % 2 === 1

  const prefix = (url: string) => (url.startsWith('/') ? `/${locale}${url}` : url)

  return (
    <div
      className={`flex flex-col ${
        reversed ? 'md:flex-row-reverse' : 'md:flex-row'
      } items-stretch gap-6 md:gap-10 bg-brand-navy-royal rounded-2xl overflow-hidden`}
    >
      {/* Image */}
      <div className="relative w-full md:w-2/5 aspect-[4/3] md:aspect-auto md:min-h-[280px] flex-shrink-0">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt || phase.title || ''}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-navy" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center p-6 md:py-10 md:pr-10">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          {phase.title && (
            <h3 className="text-white text-xl md:text-2xl font-bold uppercase tracking-wide">
              {phase.title}
            </h3>
          )}
          {phase.timeLabel && (
            <span className="inline-block bg-brand-navy text-white text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1 rounded-full">
              {phase.timeLabel}
            </span>
          )}
        </div>

        {phase.body && (
          <p className="text-white/70 text-sm md:text-base leading-relaxed mb-5">{phase.body}</p>
        )}

        <div className="flex flex-wrap gap-3">
          {phase.primaryCtaLabel && phase.primaryCtaUrl && (
            <Link
              href={prefix(phase.primaryCtaUrl)}
              className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors"
            >
              {phase.primaryCtaLabel}
            </Link>
          )}
          {phase.secondaryCtaLabel && phase.secondaryCtaUrl && (
            <Link
              href={prefix(phase.secondaryCtaUrl)}
              className="inline-flex items-center gap-2 border border-white text-white text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-white hover:text-brand-navy transition-colors"
            >
              {phase.secondaryCtaLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export async function EveningPhasesBlock({
  block,
  locale,
}: {
  block: EveningPhasesBlockType
  locale: string
}) {
  const { heading, phases } = block

  if (!phases?.length) return null

  const openDays = await getOpenDays()
  const dayLabels = locale === 'pl' ? DAY_LABELS_PL : DAY_LABELS_EN

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {heading && (
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-white font-serif text-3xl md:text-4xl font-bold uppercase tracking-tight">
              {heading}
            </h2>
            <span className="text-brand-gold text-2xl md:text-3xl font-bold">›</span>
          </div>
        )}

        {/* Weekday hours pills (from OpeningHours global) */}
        {openDays.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
            {openDays.map((od, i) => (
              <div
                key={od.id ?? od.day}
                className={`rounded-full px-4 py-3 text-center ${
                  i === 0 ? 'bg-white text-brand-navy' : 'border border-white/30 text-white'
                }`}
              >
                <div className="text-[12px] font-bold uppercase tracking-[0.1em]">
                  {od.day ? dayLabels[od.day] : ''}
                </div>
                <div
                  className={`text-[12px] font-semibold mt-1 ${
                    i === 0 ? 'text-brand-navy/70' : 'text-brand-gold'
                  }`}
                >
                  {od.openTime}
                  {od.closeTime ? ` - ${od.closeTime}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {phases.map((phase, i) => (
            <PhaseCard key={phase.id ?? i} phase={phase} index={i} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  )
}
