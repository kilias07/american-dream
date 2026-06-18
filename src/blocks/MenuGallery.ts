import type { Block } from 'payload'

/**
 * Image-tile menu (design: ADC_Restauracja). The client uploads ready-made menu
 * graphics. Each row is either:
 *  - "split": two tiles side by side (left + right), shown in one fixed shape, or
 *  - "full": a single full-width tile (e.g. the Dinner Time / Menu A-B / recap
 *    banners) shown at its natural proportions.
 * Rows can be added/reordered freely in the admin.
 */
export const MenuGallery: Block = {
  slug: 'menuGallery',
  interfaceName: 'MenuGalleryBlock',
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      admin: { placeholder: 'Karta dań' },
    },
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: { placeholder: 'NASZE MENU' },
    },
    {
      name: 'pdfDownload',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional "ZOBACZ CAŁE MENU (PDF)" download.' },
    },
    {
      name: 'pdfLabel',
      type: 'text',
      localized: true,
      admin: { placeholder: 'ZOBACZ CAŁE MENU (PDF)' },
    },
    {
      name: 'aspectRatio',
      type: 'select',
      required: true,
      defaultValue: '4/5',
      options: [
        { label: 'Portrait 2:3', value: '2/3' },
        { label: 'Portrait 3:4', value: '3/4' },
        { label: 'Portrait 4:5', value: '4/5' },
        { label: 'Square 1:1', value: '1/1' },
        { label: 'Landscape 4:3', value: '4/3' },
        { label: 'Landscape 16:10', value: '16/10' },
      ],
      admin: {
        description: 'Fixed shape for the two-column (split) tiles. Full-width tiles keep their own proportions.',
      },
    },
    {
      name: 'rows',
      type: 'array',
      labels: { singular: 'Row', plural: 'Rows' },
      admin: {
        description:
          'Each row is two tiles (left + right) or one full-width tile. Add as many rows as you need.',
      },
      fields: [
        {
          name: 'layout',
          type: 'select',
          required: true,
          defaultValue: 'split',
          options: [
            { label: 'Two tiles (left + right)', value: 'split' },
            { label: 'Full-width tile', value: 'full' },
          ],
        },
        {
          type: 'row',
          admin: {
            condition: (_, siblingData) => siblingData?.layout !== 'full',
          },
          fields: [
            {
              name: 'left',
              type: 'upload',
              relationTo: 'media',
              admin: { width: '50%' },
            },
            {
              name: 'right',
              type: 'upload',
              relationTo: 'media',
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'full',
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (_, siblingData) => siblingData?.layout === 'full',
            description: 'Single full-width image (e.g. Dinner Time / Menu A-B / recap banner).',
          },
        },
      ],
    },
  ],
}
