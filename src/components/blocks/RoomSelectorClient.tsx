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

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  )
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
          <h2 className="text-white text-3xl md:text-4xl font-bold uppercase tracking-tight mb-8">
            {heading}
          </h2>
        )}

        {/* Zone cards — photo tiles in a gold frame */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-10">
          {rooms.map((room) => {
            const isActive = room.id === active.id
            const cover = room.gallery[0]
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setActiveId(room.id)}
                aria-pressed={isActive}
                className={`relative overflow-hidden rounded-2xl border text-left transition-all aspect-[5/4] ${
                  isActive
                    ? 'border-brand-gold ring-1 ring-brand-gold'
                    : 'border-brand-gold/40 hover:border-brand-gold'
                }`}
              >
                {cover ? (
                  <Image
                    src={cover.url}
                    alt={cover.alt || room.name}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-brand-navy-royal" />
                )}
                <div
                  className={`absolute inset-0 transition-colors ${
                    isActive ? 'bg-brand-navy/40' : 'bg-brand-navy/70'
                  }`}
                />
                <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                  <span className="block text-white text-xs md:text-sm font-bold uppercase tracking-wide">
                    {room.name}
                  </span>
                  {capacityLabel(room) && (
                    <span className="mt-1 flex items-center gap-1 text-brand-gold text-[11px] md:text-xs font-semibold">
                      <UsersIcon className="w-3.5 h-3.5" />
                      {capacityLabel(room)}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Active room */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
          <RoomGallery gallery={active.gallery} name={active.name} />

          <div>
            <div className="mb-4">
              <h3 className="text-white text-2xl font-bold uppercase tracking-wide">{active.name}</h3>
              {capacityLabel(active) && (
                <p className="mt-1 flex items-center gap-1.5 text-brand-gold text-sm font-semibold">
                  <UsersIcon className="w-4 h-4" />
                  {capacityLabel(active)}
                </p>
              )}
            </div>

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
                    <li key={i} className="flex items-start gap-2.5 text-white/80 text-sm">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
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
              <h3 className="text-white text-2xl md:text-3xl font-bold uppercase tracking-tight mb-6">
                {offerHeading}
              </h3>
            )}
            <ul className="flex flex-col gap-3 max-w-3xl">
              {offerItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-white/80 text-sm md:text-base">
                  <span className="mt-[8px] w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
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
