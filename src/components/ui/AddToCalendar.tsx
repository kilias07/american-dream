'use client'
import React, { useEffect, useRef, useState } from 'react'
import {
  downloadICS,
  googleCalendarUrl,
  type CalendarEventInput,
} from '@/lib/calendar-links'

type Props = {
  event: CalendarEventInput
  locale: string
  /** Visual theme: 'light' on dark backgrounds, 'dark' on light backgrounds. */
  theme?: 'light' | 'dark'
  className?: string
}

export function AddToCalendar({ event, locale, theme = 'light', className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const label = locale === 'pl' ? 'Dodaj do kalendarza' : 'Add to calendar'
  const icalLabel = locale === 'pl' ? 'Apple / iCal (.ics)' : 'Apple / iCal (.ics)'

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const triggerClasses =
    theme === 'light'
      ? 'border-white/30 text-white hover:bg-white/10'
      : 'border-brand-navy/25 text-brand-navy hover:bg-brand-navy/5'

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 border text-[12px] font-bold uppercase tracking-[0.1em] px-4 py-2 rounded-full transition-colors ${triggerClasses}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z" />
        </svg>
        {label}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-30 mt-2 right-0 min-w-[200px] rounded-xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden"
        >
          <a
            role="menuitem"
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-brand-navy hover:bg-brand-navy/5"
          >
            Google Calendar
          </a>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              downloadICS(event)
              setOpen(false)
            }}
            className="block w-full text-left px-4 py-2.5 text-sm text-brand-navy hover:bg-brand-navy/5"
          >
            {icalLabel}
          </button>
        </div>
      )}
    </div>
  )
}
