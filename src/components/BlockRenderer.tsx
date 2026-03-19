import React from 'react'
import type { Page } from '@/payload-types'
import { HeroBannerBlock } from './blocks/HeroBannerBlock'
import { RichTextBlock } from './blocks/RichTextBlock'
import { ImageGalleryBlock } from './blocks/ImageGalleryBlock'
import { LiveStreamBlock } from './blocks/LiveStreamBlock'
import { ContentBlock } from './blocks/ContentBlock'
import { CTABlock } from './blocks/CTABlock'
import { MediaBlockComponent } from './blocks/MediaBlock'
import { ArchiveBlock } from './blocks/ArchiveBlock'
import { BannerBlock } from './blocks/BannerBlock'

type PageBlock = NonNullable<Page['layout']>[number]

export function BlockRenderer({ blocks }: { blocks: PageBlock[] | null | undefined }) {
  if (!blocks || blocks.length === 0) return null

  return (
    <>
      {blocks.map((block, i) => {
        switch (block.blockType) {
          case 'heroBanner':
            return <HeroBannerBlock key={i} block={block} />
          case 'richText':
            return <RichTextBlock key={i} block={block} />
          case 'imageGallery':
            return <ImageGalleryBlock key={i} block={block} />
          case 'liveStream':
            return <LiveStreamBlock key={i} block={block} />
          case 'content':
            return <ContentBlock key={i} block={block} />
          case 'cta':
            return <CTABlock key={i} block={block} />
          case 'mediaBlock':
            return <MediaBlockComponent key={i} block={block} />
          case 'archive':
            return <ArchiveBlock key={i} block={block} />
          case 'banner':
            return <BannerBlock key={i} block={block} />
          default:
            return null
        }
      })}
    </>
  )
}
