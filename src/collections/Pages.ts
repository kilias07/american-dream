import type { CollectionConfig } from 'payload'
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
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            if (!value && data?.title) {
              return (data.title as string)
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [HeroBanner, RichTextBlock, ImageGallery, LiveStream, Content, CallToAction, MediaBlock, Archive, Banner],
      localized: true,
    },
  ],
  hooks: {
    afterChange: [
      ({ doc }) => {
        try {
          revalidateTag(`page-${doc.slug}`)
          revalidateTag('pages')
        } catch {
          // Outside Next.js context (e.g., CLI migrations)
        }
      },
    ],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
    maxPerDoc: 50,
  },
}
