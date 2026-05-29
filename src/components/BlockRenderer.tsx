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
// ── American Dream Club blocks ──────────────────────────────────────────────
import { PageHeroBlock } from './blocks/PageHeroBlock'
import { AboutIntroBlock } from './blocks/AboutIntroBlock'
import { PromoBandBlock } from './blocks/PromoBandBlock'
import { SetMenuBlock } from './blocks/SetMenuBlock'
import { OfferCardsBlock } from './blocks/OfferCardsBlock'
import { ArtistCTABlock } from './blocks/ArtistCTABlock'
import { Notice21PlusBlock } from './blocks/Notice21PlusBlock'
import { NewsletterCTABlock } from './blocks/NewsletterCTABlock'
import { SalesContactBlock } from './blocks/SalesContactBlock'
import { EveningPhasesBlock } from './blocks/EveningPhasesBlock'
import { MapEmbedBlock } from './blocks/MapEmbedBlock'
import { RoomSelectorBlock } from './blocks/RoomSelectorBlock'
import { MusiciansGridBlock } from './blocks/MusiciansGridBlock'
import { RecurringSeriesTeaserBlock } from './blocks/RecurringSeriesTeaserBlock'
import { MenuSectionBlock } from './blocks/MenuSectionBlock'
import { NewsCarouselBlock } from './blocks/NewsCarouselBlock'
import { SpecialEventsBlock } from './blocks/SpecialEventsBlock'
import { EventsTeaserSectionBlock } from './blocks/EventsTeaserSectionBlock'
import { ContactInfoBlock } from './blocks/ContactInfoBlock'
import { ArtistFormBlock } from './blocks/ArtistFormBlock'

type PageBlock = NonNullable<Page['layout']>[number]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderBlock(block: any, i: number, locale?: string): React.ReactNode {
  const loc = locale ?? 'en'
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
    case 'pageHero':
      return <PageHeroBlock key={i} block={block} locale={loc} />
    case 'aboutIntro':
      return <AboutIntroBlock key={i} block={block} locale={loc} />
    case 'promoBand':
      return <PromoBandBlock key={i} block={block} locale={loc} />
    case 'setMenu':
      return <SetMenuBlock key={i} block={block} locale={loc} />
    case 'offerCards':
      return <OfferCardsBlock key={i} block={block} locale={loc} />
    case 'artistCTA':
      return <ArtistCTABlock key={i} block={block} locale={loc} />
    case 'notice21Plus':
      return <Notice21PlusBlock key={i} block={block} locale={loc} />
    case 'newsletterCTA':
      return <NewsletterCTABlock key={i} block={block} locale={loc} />
    case 'salesContact':
      return <SalesContactBlock key={i} block={block} locale={loc} />
    case 'eveningPhases':
      return <EveningPhasesBlock key={i} block={block} locale={loc} />
    case 'mapEmbed':
      return <MapEmbedBlock key={i} block={block} locale={loc} />
    case 'roomSelector':
      return <RoomSelectorBlock key={i} block={block} locale={loc} />
    case 'musiciansGrid':
      return <MusiciansGridBlock key={i} block={block} locale={loc} />
    case 'recurringSeriesTeaser':
      return <RecurringSeriesTeaserBlock key={i} block={block} locale={loc} />
    case 'menuSection':
      return <MenuSectionBlock key={i} block={block} locale={loc} />
    case 'newsCarousel':
      return <NewsCarouselBlock key={i} block={block} locale={loc} />
    case 'specialEvents':
      return <SpecialEventsBlock key={i} block={block} locale={loc} />
    case 'eventsTeaser':
      return <EventsTeaserSectionBlock key={i} block={block} locale={loc} />
    case 'contactInfo':
      return <ContactInfoBlock key={i} block={block} locale={loc} />
    case 'artistForm':
      return <ArtistFormBlock key={i} block={block} locale={loc} />
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
