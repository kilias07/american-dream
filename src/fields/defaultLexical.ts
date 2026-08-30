import type { TextFieldSingleValidation } from 'payload'
import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  LinkFeature,
  lexicalEditor,
  type LinkFields,
} from '@payloadcms/richtext-lexical'
import { VideoEmbed } from '@/blocks/VideoEmbed'

/**
 * Root rich-text editor. Every `richText` field that doesn't declare its own
 * `editor` inherits this one, so it decides which formatting buttons the client
 * actually sees in the admin panel.
 *
 * It used to be pinned to a hand-picked list (paragraph/bold/italic/underline/
 * link), which hid the rest of Payload's toolbar. We now start from Payload's
 * full default set — headings, alignment, indent, lists (bullet/number/todo),
 * blockquote, strikethrough, sub/superscript, inline code, horizontal rule,
 * inline image upload — and only adjust what the site can actually render.
 *
 * Dropped on purpose:
 * - `relationship`: inserts a whole related document as a block node, and the
 *   frontend has no converter for it, so it would render as nothing. Internal
 *   links are the supported way to point at a page/post (see LinkFeature).
 *
 * Hard line breaks (Shift+Enter) are core Lexical behaviour and need no
 * feature — they serialize as `linebreak` nodes and render as `<br>`.
 */
export const defaultLexical = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter((feature) => feature.key !== 'relationship'),
    // Headings: h1 is reserved for the page title, so editors get h2–h4.
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    // Always-visible toolbar. Without it the options only appear on selection
    // (inline toolbar), which is why the client couldn't find them.
    FixedToolbarFeature(),
    // Lets an editor drop a YouTube/Vimeo player between paragraphs. Pasting
    // `<iframe>` markup cannot work here — the field stores text, so the markup
    // would be shown to visitors as code (it was, on the live artist page).
    BlocksFeature({ blocks: [VideoEmbed] }),
    LinkFeature({
      // „Wewnętrzny" cel linku to strona, aktualność albo plik z Mediów — dzięki
      // `media` klient podpina PDF-a wybierając go z listy, zamiast szukać jego
      // adresu. Linki zewnętrzne (https://, mailto:, tel:) idą przez pole URL.
      enabledCollections: ['pages', 'posts', 'media'],
      fields: ({ defaultFields }) => {
        const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
          if ('name' in field && field.name === 'url') return false
          return true
        })

        return [
          ...defaultFieldsWithoutUrl,
          {
            name: 'url',
            type: 'text',
            admin: {
              condition: (_data, siblingData) => siblingData?.linkType !== 'internal',
              description:
                'Adres docelowy: https://…, /events, mailto:…, tel:+48… lub link do pliku PDF z Mediów.',
            },
            label: ({ t }) => t('fields:enterURL'),
            required: true,
            validate: ((value, options) => {
              if ((options?.siblingData as LinkFields)?.linkType === 'internal') {
                return true
              }
              return value ? true : 'URL is required'
            }) as TextFieldSingleValidation,
          },
        ]
      },
    }),
  ],
})
