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

  const headingColor = isGold ? 'text-brand-navy' : 'text-white'
  const roleColor = isGold ? 'text-brand-navy/70' : 'text-brand-gold'
  const nameColor = isGold ? 'text-brand-navy' : 'text-white'
  const detailColor = isGold ? 'text-brand-navy/80' : 'text-white/80'
  const buttonClass = isGold
    ? 'bg-brand-navy text-white hover:bg-brand-navy-royal'
    : 'bg-brand-gold text-brand-navy hover:bg-brand-gold-dark'

  return (
    <section className={`py-12 md:py-16 ${isGold ? 'bg-brand-gold' : 'bg-brand-navy'}`}>
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {/* Heading — full width on top */}
        {heading && (
          <h2
            className={`text-2xl md:text-4xl font-bold uppercase tracking-tight mb-8 text-center sm:text-left ${headingColor}`}
          >
            {heading}
          </h2>
        )}

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-10">
          {/* Photo — rounded square, black & white */}
          {photo?.url && (
            <div className="relative w-36 h-36 md:w-44 md:h-44 flex-shrink-0 rounded-2xl overflow-hidden">
              <Image
                src={photo.url}
                alt={photo.alt || member?.name || ''}
                fill
                className="object-cover object-center grayscale"
                sizes="176px"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 text-center sm:text-left">
            {member && (
              <div className="mb-6">
                {member.name && (
                  <p className={`text-xl md:text-2xl font-bold mb-1 ${nameColor}`}>{member.name}</p>
                )}
                {member.role && (
                  <p
                    className={`text-[12px] font-bold uppercase tracking-[0.14em] mb-4 ${roleColor}`}
                  >
                    {member.role}
                  </p>
                )}
                <div className={`flex flex-col gap-1 text-sm md:text-base ${detailColor}`}>
                  {member.phone && <span>{member.phone}</span>}
                  {member.email && <span>{member.email}</span>}
                </div>
              </div>
            )}

            {/* CTA pills — both filled, with icons */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              {member?.phone && callLabel && (
                <a
                  href={`tel:${member.phone.replace(/\s/g, '')}`}
                  className={`inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] px-6 py-3 rounded-full transition-colors ${buttonClass}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 16.352V17.5a1.5 1.5 0 01-1.5 1.5H15c-7.18 0-13-5.82-13-13V3.5z" />
                  </svg>
                  {callLabel}
                </a>
              )}
              {member?.email && emailLabel && (
                <a
                  href={`mailto:${member.email}`}
                  className={`inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] px-6 py-3 rounded-full transition-colors ${buttonClass}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
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
