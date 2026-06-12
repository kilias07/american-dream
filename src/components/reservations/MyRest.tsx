'use client'

import React, { useEffect } from 'react'

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

function openMyRest() {
  if (typeof window !== 'undefined' && typeof window.mrOpen === 'function') {
    window.mrOpen()
  }
}

type ReserveTriggerProps = {
  /**
   * Real external ticket URL (http…). When present, the CTA links out to buy
   * tickets; otherwise it opens the MyRest table-reservation widget.
   */
  ticketUrl?: string | null
  className?: string
  children: React.ReactNode
}

/**
 * Booking CTA used across the site. Opens the MyRest widget, except for events
 * that sell tickets through an external vendor (a real http ticket URL), which
 * keep linking out.
 */
export function ReserveTrigger({ ticketUrl, className, children }: ReserveTriggerProps) {
  if (ticketUrl && /^https?:\/\//.test(ticketUrl)) {
    return (
      <a href={ticketUrl} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" onClick={openMyRest} className={className}>
      {children}
    </button>
  )
}
