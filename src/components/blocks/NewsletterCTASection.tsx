import React from 'react'
import type { NewsletterCtaBlock as NewsletterCTABlockType } from '@/payload-types'
import type { Locale } from '@/config/locales'
import { getUILabels } from '@/lib/ui-labels'
import { NewsletterCTABlock } from './NewsletterCTABlock'

/**
 * Server wrapper for the (client) newsletter CTA: fetches the shared form
 * state-message microcopy from the `ui-labels` global and passes it down, so the
 * "sending / thank you / error" texts are CMS-editable like everything else.
 */
export async function NewsletterCTASection({
  block,
  locale,
}: {
  block: NewsletterCTABlockType
  locale: string
}) {
  const ui = await getUILabels(locale as Locale)
  return (
    <NewsletterCTABlock
      block={block}
      locale={locale}
      messages={{
        sending: ui?.forms?.sending,
        success: ui?.forms?.success,
        error: ui?.forms?.error,
      }}
    />
  )
}
