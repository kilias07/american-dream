import React from 'react'
import type { Page } from '@/payload-types'
import { HeroBannerBlock } from './blocks/HeroBannerBlock'
import { RichTextBlock } from './blocks/RichTextBlock'
import { ImageGalleryBlock } from './blocks/ImageGalleryBlock'
import { LiveStreamBlock } from './blocks/LiveStreamBlock'
import { ArchiveBlock } from './blocks/ArchiveBlock'
import { ContentBlock } from '@/blocks/Content/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { BannerBlock } from '@/blocks/Banner/Component'
import { EventsCalendarBlock } from './blocks/EventsCalendarBlock'
import { BentoSectionBlock } from './blocks/BentoSectionBlock'
import { TestimonialsBlock } from './blocks/TestimonialsBlock'

type PageBlock = NonNullable<Page['layout']>[number]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBlock(block: any, i: number, locale?: string): React.ReactNode {
  switch (block.blockType) {
    case 'heroBanner':
      return <HeroBannerBlock key={i} block={block} locale={locale} />
    case 'richText':
      return <RichTextBlock key={i} block={block} />
    case 'imageGallery':
      return <ImageGalleryBlock key={i} block={block} />
    case 'liveStream':
      return <LiveStreamBlock key={i} block={block} />
    case 'content':
      return <ContentBlock key={i} {...block} />
    case 'cta':
      return <CallToActionBlock key={i} {...block} />
    case 'mediaBlock':
      return <MediaBlock key={i} {...block} />
    case 'archive':
      return <ArchiveBlock key={i} block={block} />
    case 'banner':
      return <BannerBlock key={i} {...block} />
    case 'eventsCalendar':
      return <EventsCalendarBlock key={i} block={block} locale={locale} />
    case 'testimonials':
      return <TestimonialsBlock key={i} block={block} />
    case 'bentoSection':
      return (
        <BentoSectionBlock
          key={i}
          subheading={block.subheading}
          heading={block.heading}
          description={block.description}
          items={block.items ?? []}
        />
      )
    default:
      return null
  }
}

export function BlockRenderer({
  blocks,
  locale,
}: {
  blocks: PageBlock[] | null | undefined
  locale?: string
}) {
  if (!blocks || blocks.length === 0) return null
  return <>{blocks.map((block, i) => renderBlock(block, i, locale))}</>
}
