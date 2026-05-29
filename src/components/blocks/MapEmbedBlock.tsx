import React from 'react'
import type { MapEmbedBlock as MapEmbedBlockType } from '@/payload-types'

export function MapEmbedBlock({
  block,
  locale: _locale,
}: {
  block: MapEmbedBlockType
  locale: string
}) {
  const { embedUrl, height } = block

  if (!embedUrl) return null

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="rounded-2xl overflow-hidden">
          <iframe
            src={embedUrl}
            title="Map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full block border-0"
            style={{ height: height || 400 }}
            allowFullScreen
          />
        </div>
      </div>
    </section>
  )
}
