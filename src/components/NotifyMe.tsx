'use client'
import React, { useState } from 'react'
import type { Locale } from '@/config/locales'
import { ui } from '@/config/ui-strings'

/**
 * "Notify me about the next one" for a recurring series — the shop-style
 * reminder the club asked for.
 *
 * The address is stored against the series in the CMS (collection `signups`).
 * Sending the reminder is a separate step that needs a configured mail sender;
 * until then the club has the list and can write to it, rather than the
 * interest being lost.
 */
export function NotifyMe({
  seriesId,
  seriesName,
  locale,
}: {
  seriesId: number | string
  seriesName: string
  locale: Locale
}) {
  const t = ui(locale)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !consent || status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'event',
          email,
          consent: true,
          series: seriesId,
          locale,
          message: `Powiadom o kolejnym wydarzeniu: ${seriesName}`,
        }),
      })
      const data = (await res.json().catch((): null => null)) as { ok?: boolean } | null
      setStatus(res.ok && data?.ok ? 'done' : 'error')
      if (res.ok && data?.ok) setEmail('')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <p className="text-brand-navy text-sm font-semibold" role="status">
        {t.notifyThanks}
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border-2 border-brand-navy text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-navy hover:text-white transition-colors cursor-pointer"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
          <path d="M10.268 21a2 2 0 0 0 3.464 0" />
          <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
        </svg>
        {t.notifyMe}
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 w-full max-w-md">
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPlaceholder}
          aria-label={t.emailPlaceholder}
          className="flex-1 min-w-[200px] rounded-full border-2 border-brand-navy bg-white px-4 py-2.5 text-sm text-brand-navy placeholder:text-brand-navy/50 focus:outline-none focus:ring-2 focus:ring-brand-navy"
        />
        <button
          type="submit"
          disabled={status === 'sending' || !consent}
          className="rounded-full bg-brand-navy px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-white transition-colors enabled:hover:bg-brand-navy-royal enabled:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'sending' ? t.sending : t.notifySubmit}
        </button>
      </div>
      <label className="flex items-start gap-2 text-brand-navy text-[12px] leading-snug">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 accent-brand-navy"
        />
        {t.notifyConsent}
      </label>
      {status === 'error' && (
        <p className="text-brand-navy text-[12px] font-semibold" role="alert">
          {t.formError}
        </p>
      )}
    </form>
  )
}
