'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export type PromoPopupData = {
  eyebrow?: string | null
  heading?: string | null
  body?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
  imageUrl?: string | null
  imageAlt?: string | null
  frequency?: 'session' | 'daily' | 'always' | null
  delaySeconds?: number | null
  /** Odcisk treści — zmiana treści w CMS pokazuje pop-up ponownie wszystkim. */
  version: string
}

const KEY = 'adc-promo-dismissed'

/** Czy gość zamknął TĘ WERSJĘ pop-upu i czy blokada nadal obowiązuje. */
function wasDismissed(version: string, frequency: string): boolean {
  if (frequency === 'always') return false
  try {
    const store = frequency === 'daily' ? localStorage : sessionStorage
    const raw = store.getItem(KEY)
    if (!raw) return false
    const saved = JSON.parse(raw) as { v: string; t: number }
    if (saved.v !== version) return false // nowa treść = pokazujemy znowu
    if (frequency === 'daily') return Date.now() - saved.t < 24 * 60 * 60 * 1000
    return true
  } catch {
    return false
  }
}

function remember(version: string, frequency: string) {
  if (frequency === 'always') return
  try {
    const store = frequency === 'daily' ? localStorage : sessionStorage
    store.setItem(KEY, JSON.stringify({ v: version, t: Date.now() }))
  } catch {
    // tryb prywatny — trudno, pop-up pojawi się ponownie
  }
}

export function PromoPopup({ data, closeLabel }: { data: PromoPopupData; closeLabel: string }) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const frequency = data.frequency || 'session'

  useEffect(() => {
    if (wasDismissed(data.version, frequency)) return
    const delay = Math.max(0, (data.delaySeconds ?? 3) * 1000)
    const timer = setTimeout(() => setOpen(true), delay)
    return () => clearTimeout(timer)
  }, [data.version, data.delaySeconds, frequency])

  // Escape zamyka, a fokus wchodzi do okna — inaczej czytnik ekranu zostaje
  // w treści pod spodem i pop-up jest dla niego niewidoczny.
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function close() {
    remember(data.version, frequency)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-brand-navy/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-popup-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-brand-navy text-white shadow-2xl ring-1 ring-white/15">
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label={closeLabel}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy/70 text-white/80 ring-1 ring-white/20 transition-colors hover:bg-white hover:text-brand-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {data.imageUrl && (
          <div className="relative aspect-[16/9] w-full">
            <Image src={data.imageUrl} alt={data.imageAlt || ''} fill sizes="(min-width: 640px) 32rem, 100vw" className="object-cover" />
          </div>
        )}

        <div className="flex flex-col items-center gap-4 px-6 py-8 text-center md:px-10">
          {data.eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-gold">{data.eyebrow}</p>
          )}
          {data.heading && (
            <h2 id="promo-popup-heading" className="font-serif text-2xl leading-tight md:text-3xl">
              {data.heading}
            </h2>
          )}
          {data.body && <p className="text-base leading-relaxed text-white/75">{data.body}</p>}
          {data.ctaLabel && data.ctaHref && (
            <Link
              href={data.ctaHref}
              onClick={close}
              className="mt-1 inline-flex items-center gap-2 rounded-full bg-brand-gold px-6 py-3 text-[12px] font-bold uppercase tracking-[0.12em] text-brand-navy transition-colors hover:bg-white"
            >
              {data.ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
