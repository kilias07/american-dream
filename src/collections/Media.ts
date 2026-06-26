import type { CollectionConfig } from 'payload'
import { revalidateTag } from 'next/cache'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // These are not supported on Workers yet due to lack of sharp
    crop: false,
    focalPoint: false,
  },
  // Photos/alt text appear across statically-cached pages — bust `pages` so a
  // swapped image or edited alt shows up on the site after a CMS change.
  hooks: {
    afterChange: [
      () => {
        try {
          revalidateTag('pages', 'max')
        } catch {
          // Outside Next.js context (e.g. seed / replace-photos script)
        }
      },
    ],
    afterDelete: [
      () => {
        try {
          revalidateTag('pages', 'max')
        } catch {}
      },
    ],
  },
}
