'use client'

import { useCallback, useEffect } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'

export type LightboxImage = {
  src: string
  alt?: string
  caption?: string | null
}

/**
 * A reusable, accessible image lightbox. Controlled: the parent owns the open
 * index (null = closed) and updates it via `onIndexChange`. Supports Esc to
 * close, ←/→ to navigate, backdrop click to close, and locks body scroll while
 * open. Animated with Motion (project convention).
 */
export function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: LightboxImage[]
  index: number | null
  onClose: () => void
  onIndexChange: (next: number) => void
}) {
  const open = index !== null && index >= 0 && index < images.length
  const hasMany = images.length > 1

  const goPrev = useCallback(() => {
    if (index === null) return
    onIndexChange((index - 1 + images.length) % images.length)
  }, [index, images.length, onIndexChange])

  const goNext = useCallback(() => {
    if (index === null) return
    onIndexChange((index + 1) % images.length)
  }, [index, images.length, onIndexChange])

  // Keyboard navigation.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, goPrev, goNext])

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const current = open ? images[index] : null

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          key="lightbox"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label={current.alt || current.caption || 'Image'}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-zoom-out bg-black/85 backdrop-blur-sm"
          />

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Prev */}
          {hasMany && (
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous"
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10 sm:left-6"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <motion.figure
            key={index}
            className="relative z-[5] m-0 flex max-h-full max-w-5xl flex-col items-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Image
              src={current.src}
              alt={current.alt || current.caption || ''}
              width={1600}
              height={1200}
              className="h-auto max-h-[82vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
              sizes="100vw"
              priority
            />
            {current.caption && (
              <figcaption className="pt-4 text-center text-sm text-white/80">{current.caption}</figcaption>
            )}
          </motion.figure>

          {/* Next */}
          {hasMany && (
            <button
              type="button"
              onClick={goNext}
              aria-label="Next"
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10 sm:right-6"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Counter */}
          {hasMany && (
            <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 text-sm text-white/70">
              {index + 1} / {images.length}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
