'use client'

import React, { useEffect } from 'react'

import { warsawDayKey } from '@/lib/recurring-events'

// American Dream Club's MyRest restaurant-reservation code (cn). The remote
// integration script wires up the booking modal (an iframe to widget.myrest.io)
// and defines window.mrOpen(). Its own injected floating button is hidden via CSS
// (see globals.css) — we open the modal from the site's own design buttons.
const MYREST_CODE = 'podpa2t'
const MYREST_SRC = `https://api.myrest.io/integration?cn=${MYREST_CODE}`
const MYREST_SCRIPT_ID = 'myrest-integration'

declare global {
  interface Window {
    // Defined by the MyRest integration script once loaded; opens the booking modal.
    mrOpen?: (params?: unknown, addOnbeforeunload?: boolean) => void
  }
}

/**
 * Loads the MyRest booking widget once on the public site. We inject the remote
 * script imperatively (rather than via <script> in JSX) so it actually executes
 * on the client; the script appends its modal to <body>, outside the React root,
 * so it persists across client-side navigations.
 */
export function MyRestWidget(): React.ReactNode {
  useEffect(() => {
    if (document.getElementById(MYREST_SCRIPT_ID)) return
    const script = document.createElement('script')
    script.id = MYREST_SCRIPT_ID
    script.src = MYREST_SRC
    script.async = true
    document.body.appendChild(script)
  }, [])
  return null
}

function openMyRest(date?: string) {
  if (typeof window !== 'undefined' && typeof window.mrOpen === 'function') {
    // MyRest's mrOpen accepts { date: 'YYYY-MM-DD' } and pre-selects that night
    // in the booking widget; called without it, it opens the generic table flow.
    window.mrOpen(date ? { date } : undefined)
  }
}

/**
 * Opens the MyRest widget automatically once it has loaded. Used on the dedicated
 * `/rezerwacja` page so landing there brings up the MyRest booking app directly
 * (the old, custom reservation system is fully retired). Polls briefly because the
 * integration script that defines `window.mrOpen` loads asynchronously.
 */
export function AutoOpenMyRest(): React.ReactNode {
  useEffect(() => {
    let tries = 0
    const id = window.setInterval(() => {
      tries += 1
      if (typeof window.mrOpen === 'function') {
        window.mrOpen()
        window.clearInterval(id)
      } else if (tries > 40) {
        window.clearInterval(id) // give up after ~6s
      }
    }, 150)
    return () => window.clearInterval(id)
  }, [])
  return null
}

type ReserveTriggerProps = {
  /**
   * Event date — an ISO instant (e.g. `event.date`) or `YYYY-MM-DD`. When set,
   * the widget opens pre-selected to that night (Europe/Warsaw day, matching the
   * date shown on the calendar). Omitted → the generic "book a table" flow.
   */
  date?: string | null
  className?: string
  children: React.ReactNode
}

/**
 * The single booking CTA used across the whole site. Always opens the MyRest
 * widget (the same system as the old site, cn=podpa2t) — generic when date-less,
 * pre-selected to the event's night when a `date` is passed. We intentionally do
 * NOT link out to any other ticketing system.
 */
export function ReserveTrigger({ date, className, children }: ReserveTriggerProps) {
  const dayKey = date ? warsawDayKey(date) : undefined
  return (
    <button type="button" onClick={() => openMyRest(dayKey)} className={className}>
      {children}
    </button>
  )
}
