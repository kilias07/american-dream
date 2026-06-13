import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { localeUrl } from '@/utilities/seo'

/**
 * /llm.txt — plain-text map of the most important URLs and their purpose for
 * LLM crawlers (SEO audit §llm.txt). Hybrid: fixed sections + dynamic
 * events/news pulled from the CMS. Always 200 text/plain, no redirects.
 */
export const revalidate = 3600

const url = (path: string) => localeUrl('pl', path)

export async function GET(): Promise<Response> {
  const lines: string[] = []
  const push = (s = '') => lines.push(s)

  push('# American Dream Club')
  push()
  push(
    '> Jazz club i restauracja z muzyką na żywo w centrum Poznania (ul. Dominikańska 9). ' +
      'Koncerty, kolacje, cocktail bar, cigar lounge i organizacja imprez. ' +
      'Marka znana wcześniej jako „Pod Papugami".',
  )
  push()

  push('## Strona główna')
  push(`- [American Dream Club](${url('')}): strona główna — oferta, program, rezerwacja`)
  push()

  push('## Oferta')
  push(`- [Restauracja](${url('restaurant')}): restauracja z muzyką na żywo`)
  push(`- [Cocktail Bar & Jazz Bar](${url('bar-and-cocktails')}): koktajle i drinki`)
  push(`- [Cigar Lounge](${url('cigar-lounge')}): strefa cygar`)
  push()

  push('## Wydarzenia')
  push(`- [Wydarzenia i koncerty](${url('events')}): kalendarz wydarzeń z muzyką na żywo`)

  push()
  push('## Organizacja imprez')
  push(`- [Organizacja imprez](${url('business')}): imprezy firmowe i okolicznościowe`)
  push(`- [Wigilie firmowe](${url('business/christmas')})`)
  push(`- [Spotkania firmowe](${url('business/meetings')})`)
  push(`- [Urodziny](${url('business/birthday')})`)
  push(`- [Wieczory kawalerskie](${url('business/stag')})`)
  push(`- [Wynajem sali](${url('business/venue-hire')})`)
  push()

  push('## Aktualności')
  push(`- [Aktualności](${url('news')}): bieżące informacje i zapowiedzi`)
  push(`- [Pod Papugami to teraz American Dream Club](${url('news/pod-papugami')})`)

  push()
  push('## Rezerwacja')
  push(`- [Rezerwacja stolika](${url('rezerwacja')}): rezerwacje online`)
  push()

  push('## Kontakt')
  push(`- [Kontakt](${url('contact')}): adres, telefon, godziny otwarcia`)
  push(`- [Kontakt dla artystów](${url('kontakt-dla-artystow')})`)
  push()

  push('## Polityki')
  push(`- [Regulamin klubu](${url('regulamin')})`)
  push(`- [Polityka prywatności](${url('privacy')})`)
  push(`- [Dane firmy](${url('dane-firmy')})`)
  push()

  push('## Wersja angielska')
  push(`- [English version](${localeUrl('en', '')}): /en`)

  // Dynamic: upcoming events + latest news (best-effort; fixed sections above
  // already cover the IA if the CMS is briefly unavailable).
  try {
    const payload = await getPayload({ config: configPromise })
    const nowIso = new Date().toISOString()

    const [events, posts] = await Promise.all([
      payload.find({
        collection: 'events',
        where: { date: { greater_than_equal: nowIso } },
        sort: 'date',
        limit: 20,
        depth: 0,
        locale: 'pl',
        select: { slug: true, title: true },
      }),
      payload.find({
        collection: 'posts',
        where: { _status: { equals: 'published' } },
        sort: '-publishedAt',
        limit: 20,
        depth: 0,
        locale: 'pl',
        select: { slug: true, title: true },
      }),
    ])

    if (events.docs.length) {
      push()
      push('## Najbliższe wydarzenia')
      for (const ev of events.docs) {
        if (ev.slug) push(`- [${ev.title ?? ev.slug}](${url(`events/${ev.slug}`)})`)
      }
    }

    if (posts.docs.length) {
      push()
      push('## Najnowsze aktualności')
      for (const p of posts.docs) {
        if (p.slug) push(`- [${p.title ?? p.slug}](${url(`news/${p.slug}`)})`)
      }
    }
  } catch {
    // CMS unavailable — serve the static sections only.
  }

  push()

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
