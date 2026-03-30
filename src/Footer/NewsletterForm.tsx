'use client'
import React, { useState } from 'react'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [accepted, setAccepted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !accepted) return
    // TODO: connect to newsletter API
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        placeholder="Adres email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-2 rounded-full border border-brand-navy/30 bg-white/80 text-brand-navy text-sm placeholder:text-brand-navy/50 outline-none focus:border-brand-navy"
      />
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 accent-brand-navy"
        />
        <span className="text-brand-navy text-xs leading-snug">
          Akceptuję politykę prywatności
        </span>
      </label>
      <button
        type="submit"
        className="self-start px-8 py-2 bg-brand-navy text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-brand-navy/80 transition-colors"
      >
        Dołącz
      </button>
    </form>
  )
}
