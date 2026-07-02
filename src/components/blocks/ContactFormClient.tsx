'use client'
import React, { useState } from 'react'

type FormLabels = Partial<{
  name: string | null
  phone: string | null
  email: string | null
  message: string | null
  consent: string | null
  submit: string | null
  submitting: string | null
  sent: string | null
  error: string | null
}>

type Props = {
  formHeading: string
  locale: string
  /** Per-key overrides from the `ui-labels` CMS global; empty values ignored. */
  labels?: FormLabels
}

const labels = {
  pl: {
    name: 'Imię',
    phone: 'Telefon',
    email: 'Adres email',
    message: 'Wiadomość',
    consent: 'Akceptuję politykę prywatności',
    submit: 'Wyślij wiadomość',
    submitting: 'Wysyłanie…',
    sent: 'Dziękujemy! Wiadomość została wysłana.',
    error: 'Wystąpił błąd. Spróbuj ponownie później.',
  },
  en: {
    name: 'Name',
    phone: 'Phone',
    email: 'Email address',
    message: 'Message',
    consent: 'I accept the privacy policy',
    submit: 'Send message',
    submitting: 'Sending…',
    sent: 'Thank you! Your message has been sent.',
    error: 'Something went wrong. Please try again later.',
  },
}

export function ContactFormClient({ formHeading, locale, labels: overrides }: Props) {
  const base = locale === 'pl' ? labels.pl : labels.en
  const t = { ...base }
  if (overrides) {
    for (const key of Object.keys(base) as (keyof typeof base)[]) {
      const v = overrides[key]
      if (v && v.trim()) t[key] = v
    }
  }
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [consent, setConsent] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(false)

    const form = e.currentTarget
    const fd = new FormData(form)
    const value = (key: string) => {
      const v = fd.get(key)
      return typeof v === 'string' && v.trim() ? v.trim() : undefined
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: value('name'),
          phone: value('phone'),
          email: value('email'),
          message: value('message'),
          consent,
        }),
      })

      const data = (await res.json().catch((): null => null)) as { ok?: boolean } | null
      if (res.ok && data?.ok) {
        setSent(true)
        form.reset()
        setConsent(false)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  // Same input style as the newsletter signup (white pill, gold focus ring).
  const inputClass =
    'w-full rounded-full bg-white text-brand-navy placeholder:text-brand-navy/40 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold'
  // Multi-line variant — a pill radius clips a textarea, so soften it instead.
  const textareaClass =
    'w-full rounded-2xl bg-white text-brand-navy placeholder:text-brand-navy/40 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold'

  return (
    <div>
      {formHeading && (
        <h3 className="font-serif text-white text-2xl md:text-3xl leading-tight mb-6">
          {formHeading}
        </h3>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contact-name" className="sr-only">
              {t.name}
            </label>
            <input id="contact-name" name="name" type="text" placeholder={t.name} className={inputClass} />
          </div>
          <div>
            <label htmlFor="contact-phone" className="sr-only">
              {t.phone}
            </label>
            <input id="contact-phone" name="phone" type="tel" placeholder={t.phone} className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="contact-email" className="sr-only">
            {t.email}
          </label>
          <input id="contact-email" name="email" type="email" placeholder={t.email} className={inputClass} />
        </div>

        <div>
          <label htmlFor="contact-message" className="sr-only">
            {t.message}
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            placeholder={t.message}
            className={`${textareaClass} resize-none`}
          />
        </div>

        <label className="flex items-start gap-3 text-white/70 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand-gold flex-shrink-0"
          />
          <span>{t.consent}</span>
        </label>

        <button
          type="submit"
          disabled={!consent || submitting}
          className="bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-full hover:bg-brand-gold-dark transition-colors disabled:opacity-40"
        >
          {submitting ? t.submitting : t.submit}
        </button>

        {sent && (
          <p className="text-brand-gold text-sm pt-2" role="status">
            {t.sent}
          </p>
        )}
        {error && (
          <p className="text-red-400 text-sm pt-2" role="alert">
            {t.error}
          </p>
        )}
      </form>
    </div>
  )
}
