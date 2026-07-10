'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'

/**
 * Bramka wiekowa 18+ (uwaga klienta 2026-07 — Cigar Room).
 *
 * Popup przy wejściu na stronę z zaznaczonym `pages.requireAgeGate`:
 * „strona tylko dla użytkowników 18+ — jestem pełnoletni TAK/NIE".
 * TAK → zapamiętane w sessionStorage (na czas wizyty), NIE → strona główna.
 *
 * - Renderowana dopiero po mount (bez hydration mismatch / FOUC popupu).
 * - `role="dialog" aria-modal`, focus przeniesiony do dialogu, Tab uwięziony
 *   między przyciskami; Escape NIE zamyka — decyzja musi być jawna.
 * - Teksty edytowalne w CMS (global ui-labels → grupa ageGate), z fallbackami.
 */
const STORAGE_KEY = 'adc-age-verified'

export type AgeGateLabels = {
  title?: string | null
  body?: string | null
  confirmLabel?: string | null
  declineLabel?: string | null
}

export function AgeGate({
  labels,
  locale,
  homeHref,
}: {
  labels?: AgeGateLabels | null
  locale: string
  homeHref: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  const pl = locale !== 'en'
  const title = labels?.title || (pl ? 'Strona tylko dla użytkowników 18+' : 'This page is for adults (18+) only')
  const body =
    labels?.body ||
    (pl
      ? 'Ta część serwisu przeznaczona jest wyłącznie dla osób pełnoletnich. Czy masz ukończone 18 lat?'
      : 'This section of the site is intended for adults only. Are you 18 or older?')
  const confirmLabel = labels?.confirmLabel || (pl ? 'TAK — JESTEM PEŁNOLETNI' : 'YES — I AM 18+')
  const declineLabel = labels?.declineLabel || (pl ? 'NIE' : 'NO')

  // Po mount: pokaż popup tylko, jeśli gość nie potwierdził w tej sesji.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) !== '1') setOpen(true)
    } catch {
      setOpen(true)
    }
  }, [])

  // Blokada scrolla + focus w dialogu, dopóki otwarty.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    confirmRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Prosty focus-trap: Tab krąży wewnątrz dialogu; Escape zignorowany.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      return
    }
    if (e.key !== 'Tab') return
    const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button, a[href]')
    if (!focusables || focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  function confirm() {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {}
    setOpen(false)
  }

  function decline() {
    router.replace(homeHref)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-navy/90 backdrop-blur-sm p-6"
          onKeyDown={onKeyDown}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="age-gate-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md rounded-2xl bg-brand-navy-royal ring-1 ring-brand-gold/60 p-8 text-center shadow-2xl"
          >
            <p className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-brand-gold text-brand-gold text-lg font-black">
              18+
            </p>
            <h2 id="age-gate-title" className="font-serif text-white text-2xl md:text-3xl leading-tight mb-3">
              {title}
            </h2>
            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-7">{body}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                ref={confirmRef}
                type="button"
                onClick={confirm}
                className="inline-flex items-center justify-center bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-6 py-3 rounded-full hover:bg-brand-gold-dark transition-colors"
              >
                {confirmLabel}
              </button>
              <button
                type="button"
                onClick={decline}
                className="inline-flex items-center justify-center border border-white/60 text-white text-[12px] font-bold uppercase tracking-[0.12em] px-8 py-3 rounded-full hover:bg-white hover:text-brand-navy transition-colors"
              >
                {declineLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
