/**
 * True when a CMS-configured CTA points at the reservations destination — the
 * `/rezerwacje` (or `/rezerwacja`) page, with or without a locale prefix or
 * trailing slash. Used so that ONLY reservation buttons get rerouted to the
 * MyRest widget; genuine navigation links (MENU, PROGRAM, /bar, …) are left alone.
 *
 * Plain module (no `'use client'`) so both Server and Client Components can call it.
 */
export function isReservationUrl(url?: string | null): boolean {
  if (!url) return false
  const path = url
    .split(/[?#]/)[0]
    .replace(/^\/(pl|en)(?=\/|$)/, '') // drop optional locale prefix
    .replace(/\/$/, '') // drop trailing slash
  return path === '/rezerwacje' || path === '/rezerwacja'
}
