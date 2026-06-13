'use client'

import React, { useState } from 'react'
import type { NewsletterCtaBlock as NewsletterCTABlockType } from '@/payload-types'

export function NewsletterCTABlock({
  block,
  locale,
}: {
  block: NewsletterCTABlockType
  locale: string
}) {
  const { heading, body, placeholder, buttonLabel, consentText } = block
  const isPl = locale === 'pl'

  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || (consentText && !consent) || status === 'submitting') return

    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent: true, message: 'Newsletter signup' }),
      })
      const data = (await res.json().catch((): null => null)) as { ok?: boolean } | null
      if (res.ok && data?.ok) {
        setStatus('success')
        setEmail('')
        setConsent(false)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (!heading && !body && !buttonLabel) return null

  return (
    <section className="py-12 md:py-16 bg-brand-navy">
      <div className="container max-w-[1280px] mx-auto px-6 md:px-10">
        <div className="bg-brand-navy-royal rounded-2xl p-8 md:p-12">
          {/* Design: 2-column card — body text (left) | signup form (right). */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 md:items-center">
            <div>
          {heading && (
            <h2 className="text-white text-2xl md:text-3xl font-bold uppercase tracking-wide flex items-center gap-2 mb-3">
              {heading}
              <span className="text-brand-gold" aria-hidden>
                ›
              </span>
            </h2>
          )}

          {body && <p className="text-white/70 text-base md:text-lg leading-relaxed">{body}</p>}
            </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder || ''}
                className="flex-1 rounded-full bg-white text-brand-navy placeholder:text-brand-navy/40 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="inline-flex items-center justify-center gap-2 bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-6 py-3 rounded-full hover:bg-brand-gold-dark transition-colors whitespace-nowrap disabled:opacity-40"
              >
                {status === 'submitting' ? (isPl ? 'WYSYŁANIE…' : 'SENDING…') : buttonLabel || 'OK'}
              </button>
            </div>

            {consentText && (
              <label className="flex items-start gap-2.5 text-white/60 text-xs leading-relaxed">
                <input
                  type="checkbox"
                  name="consent"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 flex-shrink-0 accent-brand-gold"
                />
                <span>{consentText}</span>
              </label>
            )}

            {status === 'success' && (
              <p className="text-brand-gold text-sm" role="status">
                {isPl ? 'Dziękujemy! Wiadomość została wysłana.' : 'Thank you! Your message has been sent.'}
              </p>
            )}
            {status === 'error' && (
              <p className="text-red-400 text-sm" role="alert">
                {isPl ? 'Wystąpił błąd. Spróbuj ponownie później.' : 'Something went wrong. Please try again later.'}
              </p>
            )}
          </form>
          </div>
        </div>
      </div>
    </section>
  )
}
