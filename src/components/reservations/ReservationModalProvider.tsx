'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import type { Locale } from '@/config/locales'
import { ReservationModal, type ReservationPreset } from './ReservationModal'

type ReservationContextValue = {
  open: (preset?: ReservationPreset) => void
  close: () => void
}

const ReservationContext = createContext<ReservationContextValue | null>(null)

export function useReservation(): ReservationContextValue {
  const ctx = useContext(ReservationContext)
  if (!ctx) throw new Error('useReservation must be used within ReservationModalProvider')
  return ctx
}

export function ReservationModalProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const [preset, setPreset] = useState<ReservationPreset | null>(null)

  const open = (p?: ReservationPreset) => setPreset(p ?? {})
  const close = () => setPreset(null)

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!preset) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [preset])

  return (
    <ReservationContext.Provider value={{ open, close }}>
      {children}
      <AnimatePresence>
        {preset && <ReservationModal key="reservation-modal" locale={locale} preset={preset} onClose={close} />}
      </AnimatePresence>
    </ReservationContext.Provider>
  )
}
