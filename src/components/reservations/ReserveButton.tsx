'use client'

import { useReservation } from './ReservationModalProvider'
import type { ReservationPreset } from './ReservationModal'

// Entry-point button for the reservation wizard. Drop it on an event card with
// `preset={{ eventId, option }}` for the contextual flow, or with no preset on
// the general reservations page for the full wizard (spec §3).
export function ReserveButton({
  preset,
  className,
  children,
}: {
  preset?: ReservationPreset
  className?: string
  children: React.ReactNode
}) {
  const { open } = useReservation()
  return (
    <button type="button" onClick={() => open(preset)} className={className}>
      {children}
    </button>
  )
}
