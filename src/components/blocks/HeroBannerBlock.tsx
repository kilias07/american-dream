import React from 'react'
import type { Media, Page } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/ui'

type HeroBannerData = Extract<NonNullable<Page['layout']>[number], { blockType: 'heroBanner' }>

function isMedia(value: number | null | Media | undefined): value is Media {
  return typeof value === 'object' && value !== null
}

export function HeroBannerBlock({ block, locale }: { block: HeroBannerData; locale?: string }) {
  const { heading, subtext, backgroundImage, link } = block
  const image = isMedia(backgroundImage) ? backgroundImage : null

  return (
    <section
      className={cn(
        'relative min-h-[60vh] flex items-center justify-center text-center px-8 py-16 text-white',
        !image?.url && 'bg-[#1a1a2e]',
      )}
      style={
        image?.url
          ? {
              backgroundImage: `url(${image.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">{heading}</h1>
        {subtext && <p className="text-xl mb-8">{subtext}</p>}
        {link.label && (
          <CMSLink
            type={link.type}
            url={link.url}
            reference={link.reference as any}
            newTab={link.newTab}
            label={link.label}
            locale={locale}
            appearance={link.appearance ?? 'default'}
          />
        )}
      </div>
    </section>
  )
}
