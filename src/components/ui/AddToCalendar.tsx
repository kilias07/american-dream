'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { downloadICS, googleCalendarUrl, type CalendarEventInput } from '@/lib/calendar-links'

type Props = {
  event: CalendarEventInput
  locale: string
  /** Visual theme: 'light' on dark backgrounds, 'dark' on light backgrounds. */
  theme?: 'light' | 'dark'
  /** Wrapper class. */
  className?: string
  /** Size/spacing classes for the trigger button — pass this to match an adjacent
   *  button's height (e.g. a larger reserve CTA). Defaults to the compact size. */
  triggerClassName?: string
}

const MENU_WIDTH = 224
// The menu always has exactly two rows, so its height is predictable; used to
// decide whether to open below or (near the viewport bottom) above the trigger.
const MENU_EST_HEIGHT = 104

export function AddToCalendar({
  event,
  locale,
  theme = 'light',
  className = '',
  triggerClassName = 'text-[12px] tracking-[0.1em] px-4 py-2',
}: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  // Position the menu in viewport (fixed) coordinates so no ancestor's
  // `overflow-hidden` can clip it; right-align to the trigger and flip above
  // when there isn't room below.
  const reposition = useCallback(() => {
    const b = btnRef.current
    if (!b) return
    const r = b.getBoundingClientRect()
    const openUp = window.innerHeight - r.bottom < MENU_EST_HEIGHT + 12
    const top = openUp ? r.top - MENU_EST_HEIGHT - 8 : r.bottom + 8
    const left = Math.max(8, Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8))
    setCoords({ top, left })
  }, [])

  useEffect(() => {
    if (!open) return
    reposition()
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, reposition])

  const label = locale === 'pl' ? 'Dodaj do kalendarza' : 'Add to calendar'
  const icalLabel = 'Apple / iCal (.ics)'

  const triggerTheme =
    theme === 'light'
      ? 'border-white/30 text-white hover:bg-white/10'
      : 'border-brand-navy/25 text-brand-navy hover:bg-brand-navy/5'

  return (
    <div className={`inline-block ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-2 border font-bold uppercase rounded-full transition-colors ${triggerClassName} ${triggerTheme}`}
      >
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z" />
        </svg>
        {label}
      </button>

      {mounted &&
        open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_WIDTH }}
            className="z-[1000] rounded-xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden py-1"
          >
            <a
              role="menuitem"
              href={googleCalendarUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-brand-navy hover:bg-brand-navy/5"
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
              className="block w-full text-left px-4 py-2.5 text-sm font-medium text-brand-navy hover:bg-brand-navy/5"
            >
              {icalLabel}
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}
