import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { notFound } from 'next/navigation'
import type { Legal } from '@/payload-types'
import { defaultLocale, type Locale } from '@/config/locales'
import { RichTextRenderer } from '@/components/RichTextRenderer'

type LegalDocField = 'regulamin' | 'privacy' | 'companyData'

async function getLegal(locale: Locale): Promise<Legal | null> {
  try {
    const payload = await getPayload({ config: configPromise })
    // `await` so a rejected query is caught here (e.g. DB unreachable at build
    // time) instead of escaping to the caller and aborting static generation.
    return await payload.findGlobal({
      slug: 'legal',
      locale,
      fallbackLocale: defaultLocale,
      depth: 0,
    })
  } catch {
    return null
  }
}

export async function LegalDocument({
  field,
  title,
  locale,
}: {
  field: LegalDocField
  title: string
  locale: Locale
}) {
  const cached = unstable_cache(() => getLegal(locale), [`legal-${locale}`], {
    tags: ['global_legal'],
  })
  const legal = await cached()

  const content = legal?.[field]
  if (!content) notFound()

  return (
    <div className="bg-brand-navy text-white">
      <section className="pt-28 md:pt-36 pb-10 md:pb-12 border-b border-white/10">
        <div className="max-w-[860px] mx-auto px-6 md:px-10">
          <h1 className="font-serif text-3xl md:text-5xl font-bold leading-tight">{title}</h1>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <article className="max-w-[860px] mx-auto px-6 md:px-10">
          <div className="prose prose-invert max-w-none text-white/85">
            <RichTextRenderer content={content} />
          </div>
        </article>
      </section>
    </div>
  )
}
