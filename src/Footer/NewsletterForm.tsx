'use client'
import React, { useState } from 'react'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !accepted || status === 'submitting') return

    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent: accepted, message: 'Newsletter signup' }),
      })
      const data = (await res.json().catch((): null => null)) as { ok?: boolean } | null
      if (res.ok && data?.ok) {
        setStatus('success')
        setEmail('')
        setAccepted(false)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
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
        disabled={status === 'submitting'}
        className="self-start px-8 py-2 bg-brand-navy text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-brand-navy/80 transition-colors disabled:opacity-50"
      >
        {status === 'submitting' ? 'Wysyłanie…' : 'Dołącz'}
      </button>
      {status === 'success' && (
        <p className="text-brand-navy text-xs font-semibold" role="status">
          Dziękujemy! Wiadomość została wysłana.
        </p>
      )}
      {status === 'error' && (
        <p className="text-red-700 text-xs font-semibold" role="alert">
          Wystąpił błąd. Spróbuj ponownie później.
        </p>
      )}
    </form>
  )
}
