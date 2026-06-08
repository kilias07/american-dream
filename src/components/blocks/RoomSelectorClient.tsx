'use client'

import React, { useState } from 'react'
import Image from 'next/image'

type GalleryImage = { url: string; alt: string }

export type RoomData = {
  id: number
  name: string
  capacity?: number | null
  description?: string | null
  equipment: string[]
  gallery: GalleryImage[]
}

type Props = {
  rooms: RoomData[]
  heading?: string | null
  equipmentHeading?: string | null
  offerHeading?: string | null
  offerItems: string[]
  locale: string
}

function RoomGallery({ gallery, name }: { gallery: GalleryImage[]; name: string }) {
  const [index, setIndex] = useState(0)
  const total = gallery.length

  if (total === 0) {
    return <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-brand-navy" />
  }

  const current = gallery[Math.min(index, total - 1)]
  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  return (
    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-brand-navy">
      <Image
        src={current.url}
        alt={current.alt || name}
        fill
        className="object-cover object-center"
        sizes="(max-width: 1024px) 100vw, 60vw"
      />

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-brand-navy/70 text-white flex items-center justify-center hover:bg-brand-navy transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-brand-navy/70 text-white flex items-center justify-center hover:bg-brand-navy transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {gallery.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === Math.min(index, total - 1) ? 'bg-brand-gold scale-125' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function RoomSelectorClient({
  rooms,
  heading,
  equipmentHeading,
  offerHeading,
  offerItems,
  locale,
}: Props) {
  const defaultRoom = rooms.find((r) => /vip/i.test(r.name)) ?? rooms[0]
  const [activeId, setActiveId] = useState(defaultRoom?.id)
  const active = rooms.find((r) => r.id === activeId) ?? rooms[0]

  if (!active) return null

  const capacityLabel = (room: RoomData) =>
    room.capacity != null
      ? `${locale === 'pl' ? 'do' : 'up to'} ${room.capacity} ${locale === 'pl' ? 'osób' : 'people'}`
      : null

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        {heading && (
          <h2 className="text-white font-serif text-3xl md:text-4xl font-bold uppercase tracking-tight mb-8">
            {heading}
          </h2>
        )}

        {/* Tab selector */}
        <div className="flex flex-wrap gap-3 mb-8">
          {rooms.map((room) => {
            const isActive = room.id === active.id
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setActiveId(room.id)}
                className={`flex flex-col items-start text-left px-5 py-3 rounded-2xl border transition-colors ${
                  isActive
                    ? 'bg-brand-gold border-brand-gold text-brand-navy'
                    : 'bg-brand-navy-royal border-white/15 text-white hover:border-brand-gold'
                }`}
              >
                <span className="text-sm font-bold uppercase tracking-wide">{room.name}</span>
                {capacityLabel(room) && (
                  <span
                    className={`text-[11px] mt-0.5 ${
                      isActive ? 'text-brand-navy/70' : 'text-white/60'
                    }`}
                  >
                    {capacityLabel(room)}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Active room */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
          <RoomGallery gallery={active.gallery} name={active.name} />

          <div>
            {active.description && (
              <p className="text-white/75 text-sm md:text-base leading-relaxed mb-6">
                {active.description}
              </p>
            )}

            {active.equipment.length > 0 && (
              <div className="mb-6">
                {equipmentHeading && (
                  <h3 className="text-brand-gold text-[12px] font-bold uppercase tracking-[0.14em] mb-3">
                    {equipmentHeading}
                  </h3>
                )}
                <ul className="flex flex-col gap-2">
                  {active.equipment.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                      <span className="text-brand-gold mt-0.5">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Offer */}
        {offerItems.length > 0 && (
          <div className="mt-12 border-t border-white/10 pt-10">
            {offerHeading && (
              <h3 className="text-white font-serif text-2xl md:text-3xl font-bold uppercase tracking-tight mb-6">
                {offerHeading}
              </h3>
            )}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {offerItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                  <span className="text-brand-gold mt-0.5">›</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
