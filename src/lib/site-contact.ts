import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { SiteSetting } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'

/**
 * Contact details resolved from the `site-settings` global (single source of
 * truth) with the known venue values as a safe fallback. Used by the footer,
 * SEO structured data (JSON-LD), calendar exports and llm.txt so the phone /
 * email / address live in ONE editable place.
 *
 * `address` is the single localized string an editor types (e.g.
 * "ul. Dominikańska 9, 61-762 Poznań"); the structured `streetAddress` /
 * `postalCode` / `addressLocality` are parsed from it for schema.org.
 */
const FALLBACK = {
  phone: '+48 500 210 333',
  email: 'rezerwacja@americandreamclub.pl',
  address: 'ul. Dominikańska 9, 61-762 Poznań',
  streetAddress: 'ul. Dominikańska 9',
  postalCode: '61-762',
  addressLocality: 'Poznań',
}

export type SiteContact = typeof FALLBACK

function parseAddress(address: string): Pick<
  SiteContact,
  'streetAddress' | 'postalCode' | 'addressLocality'
> {
  const [street, ...rest] = address.split(',').map((s) => s.trim())
  const tail = rest.join(', ')
  const m = tail.match(/(\d{2}-\d{3})\s*(.*)/)
  return {
    streetAddress: street || FALLBACK.streetAddress,
    postalCode: m?.[1] || FALLBACK.postalCode,
    addressLocality: (m?.[2] || tail || FALLBACK.addressLocality).trim() || FALLBACK.addressLocality,
  }
}

export async function getSiteContact(locale: Locale = defaultLocale): Promise<SiteContact> {
  const cached = unstable_cache(
    async (): Promise<SiteContact> => {
      try {
        const payload = await getPayload({ config: configPromise })
        const s = (await payload.findGlobal({
          slug: 'site-settings',
          locale,
          depth: 0,
        })) as SiteSetting | null
        const phone = s?.phones?.find((p) => p?.number)?.number || FALLBACK.phone
        const email = s?.emails?.find((e) => e?.email)?.email || FALLBACK.email
        const address = s?.address || FALLBACK.address
        return { phone, email, address, ...parseAddress(address) }
      } catch {
        return FALLBACK
      }
    },
    [`site-contact-${locale}`],
    { tags: ['global_site_settings'] },
  )
  return cached()
}
