'use client'
import React, { useState } from 'react'

type Props = {
  placeholder?: string
  consentText?: string
  submitLabel?: string
  sendingLabel?: string
  successText?: string
  errorText?: string
}

export function NewsletterForm({
  placeholder = 'Adres email',
  consentText = 'Akceptuję politykę prywatności',
  submitLabel = 'Dołącz',
  sendingLabel = 'Wysyłanie…',
  successText = 'Dziękujemy! Wiadomość została wysłana.',
  errorText = 'Wystąpił błąd. Spróbuj ponownie później.',
}: Props) {
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
        placeholder={placeholder}
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
        <span className="text-brand-navy text-xs leading-snug">{consentText}</span>
      </label>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="self-start px-8 py-2 bg-brand-navy text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-brand-navy/80 transition-colors disabled:opacity-50"
      >
        {status === 'submitting' ? sendingLabel : submitLabel}
      </button>
      {status === 'success' && (
        <p className="text-brand-navy text-xs font-semibold" role="status">
          {successText}
        </p>
      )}
      {status === 'error' && (
        <p className="text-red-700 text-xs font-semibold" role="alert">
          {errorText}
        </p>
      )}
    </form>
  )
}
