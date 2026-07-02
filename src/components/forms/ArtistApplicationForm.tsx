'use client'

import React, { useState } from 'react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

// Same input style as the newsletter signup (white pill, gold focus ring).
const inputClass =
  'w-full rounded-full bg-white text-brand-navy placeholder:text-brand-navy/40 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold'

// Multi-line variant — a pill radius clips a textarea, so soften it instead.
const textareaClass =
  'w-full rounded-2xl bg-white text-brand-navy placeholder:text-brand-navy/40 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-gold'

const labelClass = 'block text-white/70 text-xs font-bold uppercase tracking-[0.14em] mb-2'

const sectionHeadingClass =
  'font-serif text-white text-2xl md:text-3xl leading-tight mb-6 pb-3 border-b border-white/10'

const fieldWrapClass = 'flex flex-col'

export function ArtistApplicationForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [consent, setConsent] = useState(false)
  // Comma/newline-separated list of recording URLs entered as free text.
  const [recordings, setRecordings] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'submitting') return

    setStatus('submitting')
    setErrorMessage('')

    const form = e.currentTarget
    const fd = new FormData(form)

    const getString = (key: string) => {
      const value = fd.get(key)
      return typeof value === 'string' && value.trim() ? value.trim() : undefined
    }

    const recordingUrls = recordings
      .split(/[\n,]+/)
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => ({ url }))

    const body: Record<string, unknown> = {
      fullName: getString('fullName'),
      phone: getString('phone'),
      email: getString('email'),
      city: getString('city'),
      instrument: getString('instrument'),
      genres: getString('genres'),
      preferredLineup: getString('preferredLineup'),
      bandName: getString('bandName'),
      rateProposal: getString('rateProposal'),
      dateProposals: getString('dateProposals'),
      repertoire: getString('repertoire'),
      musicEducation: getString('musicEducation'),
      schoolName: getString('schoolName'),
      educationDetails: getString('educationDetails'),
      stageExperience: getString('stageExperience'),
      pastVenues: getString('pastVenues'),
      facebook: getString('facebook'),
      instagram: getString('instagram'),
      message: getString('message'),
    }

    if (recordingUrls.length > 0) {
      body.recordings = recordingUrls
    }

    // Drop undefined keys so we only send provided values.
    Object.keys(body).forEach((key) => body[key] === undefined && delete body[key])

    try {
      const res = await fetch('/api/artist-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 201) {
        setStatus('success')
        form.reset()
        setConsent(false)
        setRecordings('')
        return
      }

      let message = 'Wystąpił błąd. Spróbuj ponownie później.'
      try {
        const data = (await res.json()) as { errors?: { message?: string }[] }
        if (data?.errors?.[0]?.message) message = data.errors[0].message
      } catch {
        // ignore JSON parse errors
      }
      setErrorMessage(message)
      setStatus('error')
    } catch {
      setErrorMessage('Wystąpił błąd. Spróbuj ponownie później.')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Design: the form groups sit in two side-by-side columns. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-12 items-start">
      {/* Dane kontaktowe */}
      <fieldset>
        <legend className={sectionHeadingClass}>Dane kontaktowe</legend>
        <div className="grid grid-cols-1 gap-4">
          <div className={`${fieldWrapClass} md:col-span-2`}>
            <label htmlFor="fullName" className={labelClass}>
              Imię i nazwisko *
            </label>
            <input id="fullName" name="fullName" type="text" required className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="phone" className={labelClass}>
              Telefon
            </label>
            <input id="phone" name="phone" type="tel" className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="email" className={labelClass}>
              Adres email *
            </label>
            <input id="email" name="email" type="email" required className={inputClass} />
          </div>
          <div className={`${fieldWrapClass} md:col-span-2`}>
            <label htmlFor="city" className={labelClass}>
              Miasto
            </label>
            <input id="city" name="city" type="text" className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Profil muzyczny */}
      <fieldset>
        <legend className={sectionHeadingClass}>Profil muzyczny</legend>
        <div className="grid grid-cols-1 gap-4">
          <div className={fieldWrapClass}>
            <label htmlFor="instrument" className={labelClass}>
              Instrument
            </label>
            <input id="instrument" name="instrument" type="text" className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="genres" className={labelClass}>
              Gatunki
            </label>
            <input id="genres" name="genres" type="text" className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="preferredLineup" className={labelClass}>
              Preferowany skład
            </label>
            <select id="preferredLineup" name="preferredLineup" className={inputClass} defaultValue="">
              <option value="">Wybierz…</option>
              <option value="solo">Solo</option>
              <option value="duo">Duo</option>
              <option value="trio">Trio</option>
              <option value="quartet">Kwartet</option>
              <option value="band">Zespół</option>
              <option value="other">Inny</option>
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="bandName" className={labelClass}>
              Nazwa zespołu
            </label>
            <input id="bandName" name="bandName" type="text" className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="rateProposal" className={labelClass}>
              Proponowana stawka
            </label>
            <input id="rateProposal" name="rateProposal" type="text" className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="dateProposals" className={labelClass}>
              Proponowane terminy
            </label>
            <textarea id="dateProposals" name="dateProposals" rows={3} className={`${textareaClass} resize-none`} />
          </div>
          <div className={`${fieldWrapClass} md:col-span-2`}>
            <label htmlFor="repertoire" className={labelClass}>
              Repertuar
            </label>
            <textarea id="repertoire" name="repertoire" rows={4} className={`${textareaClass} resize-none`} />
          </div>
        </div>
      </fieldset>

      {/* Wykształcenie i doświadczenie */}
      <fieldset>
        <legend className={sectionHeadingClass}>Wykształcenie i doświadczenie</legend>
        <div className="grid grid-cols-1 gap-4">
          <div className={fieldWrapClass}>
            <label htmlFor="musicEducation" className={labelClass}>
              Wykształcenie muzyczne
            </label>
            <select id="musicEducation" name="musicEducation" className={inputClass} defaultValue="">
              <option value="">Wybierz…</option>
              <option value="none">Brak</option>
              <option value="inProgress">W trakcie</option>
              <option value="secondary">Średnie</option>
              <option value="higher">Wyższe</option>
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="schoolName" className={labelClass}>
              Nazwa szkoły / uczelni
            </label>
            <input id="schoolName" name="schoolName" type="text" className={inputClass} />
          </div>
          <div className={`${fieldWrapClass} md:col-span-2`}>
            <label htmlFor="educationDetails" className={labelClass}>
              Szczegóły wykształcenia
            </label>
            <textarea
              id="educationDetails"
              name="educationDetails"
              rows={3}
              className={`${textareaClass} resize-none`}
            />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="stageExperience" className={labelClass}>
              Doświadczenie sceniczne
            </label>
            <select id="stageExperience" name="stageExperience" className={inputClass} defaultValue="">
              <option value="">Wybierz…</option>
              <option value="none">Brak</option>
              <option value="some">Niewielkie</option>
              <option value="experienced">Doświadczony</option>
              <option value="professional">Profesjonalne</option>
            </select>
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="pastVenues" className={labelClass}>
              Dotychczasowe miejsca występów
            </label>
            <textarea id="pastVenues" name="pastVenues" rows={3} className={`${textareaClass} resize-none`} />
          </div>
        </div>
      </fieldset>

      {/* Twoje nagrania */}
      <fieldset>
        <legend className={sectionHeadingClass}>Twoje nagrania</legend>
        <div className={fieldWrapClass}>
          <label htmlFor="recordings" className={labelClass}>
            Linki do nagrań (po jednym w wierszu)
          </label>
          <textarea
            id="recordings"
            name="recordings"
            rows={4}
            value={recordings}
            onChange={(e) => setRecordings(e.target.value)}
            placeholder="https://youtube.com/…&#10;https://soundcloud.com/…"
            className={`${textareaClass} resize-none`}
          />
        </div>
      </fieldset>

      {/* Media społecznościowe */}
      <fieldset>
        <legend className={sectionHeadingClass}>Media społecznościowe</legend>
        <div className="grid grid-cols-1 gap-4">
          <div className={fieldWrapClass}>
            <label htmlFor="facebook" className={labelClass}>
              Facebook
            </label>
            <input id="facebook" name="facebook" type="text" className={inputClass} />
          </div>
          <div className={fieldWrapClass}>
            <label htmlFor="instagram" className={labelClass}>
              Instagram
            </label>
            <input id="instagram" name="instagram" type="text" className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Wiadomość */}
      <fieldset>
        <legend className={sectionHeadingClass}>Wiadomość</legend>
        <div className={fieldWrapClass}>
          <label htmlFor="message" className={labelClass}>
            Twoja wiadomość
          </label>
          <textarea id="message" name="message" rows={5} className={`${textareaClass} resize-none`} />
        </div>
      </fieldset>

      </div>

      {/* Consent + submit — full width under the two columns */}
      <div className="space-y-5 mt-12">
        <label className="flex items-start gap-3 text-white/70 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
            className="mt-0.5 h-4 w-4 accent-brand-gold flex-shrink-0"
          />
          <span>Akceptuję politykę prywatności</span>
        </label>

        <button
          type="submit"
          disabled={!consent || status === 'submitting'}
          className="bg-brand-gold text-brand-navy text-[12px] font-bold uppercase tracking-[0.12em] px-6 py-3 rounded-full hover:bg-brand-gold-dark transition-colors disabled:opacity-40"
        >
          {status === 'submitting' ? 'WYSYŁANIE…' : 'WYŚLIJ WIADOMOŚĆ'}
        </button>

        {status === 'success' && (
          <p className="text-brand-gold text-sm pt-1" role="status">
            Dziękujemy! Odezwiemy się do Ciebie.
          </p>
        )}
        {status === 'error' && (
          <p className="text-red-400 text-sm pt-1" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </form>
  )
}
