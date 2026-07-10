import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { revalidateTag } from 'next/cache'
import {
  HeroBanner,
  RichTextBlock,
  ImageGallery,
  LiveStream,
  Content,
  CallToAction,
  MediaBlock,
  Archive,
  Banner,
  EventsCalendar,
  BentoSection,
  Testimonials,
  PageHero,
  AboutIntro,
  MenuSection,
  MenuGallery,
  MenuImage,
  SetMenu,
  SpecialMenu,
  PromoBand,
  EventsTeaser,
  SpecialEvents,
  MusiciansGrid,
  RecurringSeriesTeaser,
  NewsCarousel,
  RoomSelector,
  OfferCards,
  SalesContact,
  EveningPhases,
  ContactInfo,
  MapEmbed,
  ArtistCTA,
  Notice21Plus,
  NewsletterCTA,
  ArtistForm,
} from '../blocks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return { _status: { equals: 'published' } }
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, locale }) =>
        `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/${locale?.code || 'en'}/${data?.slug || ''}`,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    slugField(),
    {
      name: 'layout',
      type: 'blocks',
      blocks: [
        PageHero,
        HeroBanner,
        AboutIntro,
        BentoSection,
        MenuSection,
        MenuGallery,
        MenuImage,
        SetMenu,
        SpecialMenu,
        PromoBand,
        EventsTeaser,
        SpecialEvents,
        EventsCalendar,
        MusiciansGrid,
        RecurringSeriesTeaser,
        NewsCarousel,
        RoomSelector,
        OfferCards,
        SalesContact,
        EveningPhases,
        ContactInfo,
        MapEmbed,
        ArtistCTA,
        Notice21Plus,
        NewsletterCTA,
        ArtistForm,
        Testimonials,
        RichTextBlock,
        ImageGallery,
        LiveStream,
        Content,
        CallToAction,
        MediaBlock,
        Archive,
        Banner,
      ],
      localized: true,
    },
    {
      // Popup 18+ przy wejściu na stronę (uwaga klienta 2026-07 — Cigar Room).
      // Teksty popupu edytowalne w globalu „Teksty interfejsu (UI)".
      name: 'requireAgeGate',
      type: 'checkbox',
      defaultValue: false,
      label: 'Bramka wiekowa 18+ (popup przy wejściu)',
      admin: {
        position: 'sidebar',
        description: 'Gość musi potwierdzić pełnoletność; „NIE" przenosi na stronę główną.',
      },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc }) => {
        try {
          revalidateTag(`page-${doc.slug}`, 'max')
          revalidateTag('pages', 'max')
        } catch {
          // Outside Next.js context (e.g., CLI migrations)
        }
      },
    ],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
    },
    maxPerDoc: 50,
  },
}
