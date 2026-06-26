import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import type { UiLabel } from '@/payload-types'
import { type Locale } from '@/config/locales'

/**
 * Site-wide interface microcopy from the `ui-labels` global. Server components
 * call this directly; client components receive the strings they need as props
 * from their server parent. Always read with a fallback — `pick(ui?.x, 'default')`
 * — so an empty/missing field never blanks the UI.
 */
export async function getUILabels(locale: Locale): Promise<UiLabel | null> {
  const cached = unstable_cache(
    async (): Promise<UiLabel | null> => {
      try {
        const payload = await getPayload({ config: configPromise })
        return (await payload.findGlobal({ slug: 'ui-labels', locale, depth: 0 })) as UiLabel
      } catch {
        return null
      }
    },
    [`ui-labels-${locale}`],
    { tags: ['global_ui_labels'] },
  )
  return cached()
}

/** Returns `value` when it is a non-empty string, otherwise `fallback`. */
export function pick(value: string | null | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback
}
