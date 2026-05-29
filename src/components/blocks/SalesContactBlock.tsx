import React from 'react'
import Image from 'next/image'
import type { SalesContactBlock as SalesContactBlockType, Media, TeamMember } from '@/payload-types'

function isMedia(value: Media | number | null | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

export function SalesContactBlock({
  block,
  locale: _locale,
}: {
  block: SalesContactBlockType
  locale: string
}) {
  const { heading, teamMember, callLabel, emailLabel, style } = block

  const member =
    typeof teamMember === 'object' && teamMember !== null ? (teamMember as TeamMember) : null

  const isGold = (style ?? 'gold') === 'gold'
  const photo = member && isMedia(member.photo) ? member.photo : null

  return (
    <section className={`py-12 md:py-16 ${isGold ? 'bg-brand-gold' : 'bg-brand-navy'}`}>
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Photo */}
          {photo?.url && (
            <div className="relative w-40 h-40 md:w-48 md:h-48 flex-shrink-0 rounded-full overflow-hidden">
              <Image
                src={photo.url}
                alt={photo.alt || member?.name || ''}
                fill
                className="object-cover object-center"
                sizes="192px"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 text-center md:text-left">
            {heading && (
              <h2
                className={`font-serif text-3xl md:text-4xl font-bold mb-5 ${
                  isGold ? 'text-brand-navy' : 'text-white'
                }`}
              >
                {heading}
              </h2>
            )}

            {member && (
              <div className="mb-6">
                {member.role && (
                  <p
                    className={`text-[12px] font-bold uppercase tracking-[0.12em] mb-1 ${
                      isGold ? 'text-brand-navy/70' : 'text-brand-gold'
                    }`}
                  >
                    {member.role}
                  </p>
                )}
                {member.name && (
                  <p
                    className={`text-xl font-bold mb-2 ${
                      isGold ? 'text-brand-navy' : 'text-white'
                    }`}
                  >
                    {member.name}
                  </p>
                )}
                <div
                  className={`flex flex-col sm:flex-row items-center md:items-start sm:gap-5 gap-1 text-sm ${
                    isGold ? 'text-brand-navy/80' : 'text-white/80'
                  }`}
                >
                  {member.phone && <span>{member.phone}</span>}
                  {member.email && <span>{member.email}</span>}
                </div>
              </div>
            )}

            {/* CTA pills */}
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              {member?.phone && callLabel && (
                <a
                  href={`tel:${member.phone.replace(/\s/g, '')}`}
                  className={`inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full transition-colors ${
                    isGold
                      ? 'bg-brand-navy text-white hover:bg-brand-navy-royal'
                      : 'bg-brand-gold text-brand-navy hover:bg-brand-gold-dark'
                  }`}
                >
                  {callLabel}
                </a>
              )}
              {member?.email && emailLabel && (
                <a
                  href={`mailto:${member.email}`}
                  className={`inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full border transition-colors ${
                    isGold
                      ? 'border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white'
                      : 'border-white text-white hover:bg-white hover:text-brand-navy'
                  }`}
                >
                  {emailLabel}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
