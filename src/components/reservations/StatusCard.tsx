'use client'

import { motion } from 'motion/react'

type Tone = 'success' | 'pending' | 'error'

const ACCENT: Record<Tone, string> = {
  success: 'text-emerald-400 border-emerald-400/30',
  pending: 'text-amber-300 border-amber-300/30',
  error: 'text-red-400 border-red-400/30',
}

const ICON: Record<Tone, string> = { success: '✓', pending: '…', error: '!' }

export function StatusCard({
  tone,
  heading,
  message,
  reservationNumber,
  footer,
}: {
  tone: Tone
  heading: string
  message: string
  reservationNumber?: string
  footer?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[560px] mx-auto px-6"
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10 text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
          className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border text-2xl ${ACCENT[tone]}`}
        >
          {ICON[tone]}
        </motion.div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold leading-tight">{heading}</h1>
        <p className="mt-4 text-white/80 leading-relaxed">{message}</p>
        {reservationNumber && (
          <p className="mt-6 text-sm text-white/50">
            <span className="uppercase tracking-wide">Nr / No.</span>{' '}
            <span className="font-mono text-white/80">{reservationNumber}</span>
          </p>
        )}
        {footer && <p className="mt-6 text-sm text-white/50">{footer}</p>}
      </div>
    </motion.div>
  )
}
