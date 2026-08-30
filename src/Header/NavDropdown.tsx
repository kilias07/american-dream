'use client'
import React, { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'

export type NavChild = { href: string; label: string; newTab?: boolean }

/**
 * A header entry that opens a list of sub-pages.
 *
 * Opens on hover for mouse users and on click/Enter for everyone else; the
 * parent stays a real link, so the section itself is still reachable. Closing
 * is deliberate about focus: leaving with the mouse, pressing Escape, or moving
 * focus out of the group all shut it, which keeps it usable from the keyboard
 * without trapping anyone inside.
 */
export function NavDropdown({
  href,
  label,
  items,
  className,
}: {
  href: string
  label: string
  items: NavChild[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <div
      ref={wrap}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <div className="flex items-center gap-1">
        <Link href={href} className={className}>
          {label}
        </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          aria-label={`${label} — rozwiń`}
          onClick={() => setOpen((v) => !v)}
          className="text-white/70 hover:text-brand-gold transition-colors cursor-pointer p-0.5"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      <div
        id={id}
        hidden={!open}
        className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3"
      >
        <ul className="min-w-[220px] rounded-xl border border-white/15 bg-brand-navy py-2 shadow-xl">
          {items.map((item, i) => (
            <li key={i}>
              <Link
                href={item.href}
                {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="block px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.03em] text-white whitespace-nowrap hover:bg-white/10 hover:text-brand-gold transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
