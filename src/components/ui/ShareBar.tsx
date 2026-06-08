'use client'
import React, { useState } from 'react'

export function ShareBar({ label }: { label: string }) {
  const [copied, setCopied] = useState(false)

  function shareTo(network: 'facebook' | 'twitter') {
    if (typeof window === 'undefined') return
    const url = encodeURIComponent(window.location.href)
    const href =
      network === 'facebook'
        ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
        : `https://twitter.com/intent/tweet?url=${url}`
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  async function copyLink() {
    if (typeof window === 'undefined') return
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  const btn =
    'w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-brand-navy transition-colors'

  return (
    <div className="flex items-center gap-3">
      <span className="text-white/70 text-[12px] font-bold uppercase tracking-[0.14em]">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => shareTo('facebook')} className={btn} aria-label="Facebook">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        </button>
        <button type="button" onClick={() => shareTo('twitter')} className={btn} aria-label="X / Twitter">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </button>
        <button type="button" onClick={copyLink} className={btn} aria-label="Copy link">
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
