import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { createHash } from 'node:crypto'
import type { Locale } from '@/config/locales'
import type { PromoPopup as PromoPopupGlobal } from '@/payload-types'
import { localeHref } from '@/utilities/href'
import { PromoPopup, type PromoPopupData } from './PromoPopup'

/**
 * Serwerowa otoczka pop-upu promocyjnego: pobiera treść z globalu, sprawdza
 * warunki wyświetlenia i dopiero wtedy wysyła cokolwiek do przeglądarki.
 *
 * Gdy pop-up jest wyłączony albo poza oknem dat, komponent kliencki NIE trafia
 * do strony w ogóle — nie ma zbędnego JavaScriptu ani migotania treści.
 */
async function getPromo(locale: Locale) {
  const cached = unstable_cache(
    async () => {
      try {
        const payload = await getPayload({ config: configPromise })
        return await payload.findGlobal({ slug: 'promo-popup', locale, depth: 1 })
      } catch {
        return null
      }
    },
    [`promo-popup-${locale}`],
    { tags: ['global_promo_popup'] },
  )
  return cached()
}

function isMedia(v: unknown): v is { url?: string | null; alt?: string | null } {
  return typeof v === 'object' && v !== null
}

export async function PromoPopupSection({ locale }: { locale: Locale }) {
  const promo = (await getPromo(locale)) as PromoPopupGlobal | null
  if (!promo || promo.enabled !== true) return null

  // Okno dat liczone na serwerze — klient nie musi znać reguł, a wyłączona
  // promocja nie trafia do HTML-a nawet w postaci ukrytej.
  const now = Date.now()
  const start = promo.startDate ? Date.parse(promo.startDate) : null
  const end = promo.endDate ? Date.parse(promo.endDate) : null
  if (start && !Number.isNaN(start) && now < start) return null
  if (end && !Number.isNaN(end) && now > end) return null

  const heading = promo.heading || ''
  const body = promo.body || ''
  if (!heading && !body) return null // pusty pop-up nie ma sensu

  const media = isMedia(promo.image) ? promo.image : null
  const rawUrl = promo.ctaUrl || ''
  const ctaHref = rawUrl.startsWith('/') ? localeHref(locale, rawUrl) : rawUrl || null

  const data: PromoPopupData = {
    eyebrow: promo.eyebrow || null,
    heading,
    body,
    ctaLabel: promo.ctaLabel || null,
    ctaHref,
    imageUrl: media?.url || null,
    imageAlt: media?.alt || heading,
    frequency: (promo.frequency as PromoPopupData['frequency']) ?? 'session',
    delaySeconds: promo.delaySeconds ?? 3,
    // Odcisk treści: po edycji w CMS pop-up pokaże się ponownie także tym,
    // którzy zamknęli poprzednią wersję.
    version: createHash('sha1')
      .update([heading, body, promo.eyebrow, promo.ctaLabel, rawUrl, media?.url].join('|'))
      .digest('hex')
      .slice(0, 10),
  }

  return <PromoPopup data={data} closeLabel={locale === 'en' ? 'Close' : 'Zamknij'} />
}
