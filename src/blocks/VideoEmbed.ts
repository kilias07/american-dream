import type { Block } from 'payload'

/**
 * A video player that can sit *inside* rich text — used mainly in artist
 * biographies, where the client wants a clip between two paragraphs.
 *
 * Editors paste the ordinary address they copied from YouTube; the frontend
 * works the embed URL out from it (see `src/components/VideoEmbed.tsx`). This
 * exists because pasting `<iframe>` markup into the editor does not work: the
 * rich-text field stores text, so the markup ends up on the page as visible
 * code — which is exactly what happened on the live site.
 */
export const VideoEmbed: Block = {
  slug: 'videoEmbed',
  interfaceName: 'VideoEmbedBlock',
  labels: { singular: 'Film (YouTube / Vimeo)', plural: 'Filmy (YouTube / Vimeo)' },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Adres filmu',
      admin: {
        description:
          'Wklej zwykły link, np. https://www.youtube.com/watch?v=… , https://youtu.be/… lub https://vimeo.com/… . Nie wklejaj kodu <iframe>.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Podaj adres filmu.'
        if (/<\s*iframe/i.test(value))
          return 'To jest kod HTML, nie adres. Wklej sam link do filmu, np. https://www.youtube.com/watch?v=…'
        if (!/^https?:\/\//i.test(value)) return 'Adres musi zaczynać się od https://'
        if (!/(youtube\.com|youtu\.be|vimeo\.com)/i.test(value))
          return 'Obsługujemy filmy z YouTube i Vimeo.'
        return true
      },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      label: 'Podpis (opcjonalnie)',
      admin: { description: 'Krótki opis wyświetlany pod filmem.' },
    },
  ],
}
