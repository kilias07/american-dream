'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Locale } from '@/config/locales'
import { getReservationDict } from './dictionary'
import type { AvailabilityEvent } from '@/app/(frontend)/api/reservations/availability/route'

export type ReservationPreset = { eventId?: number; option?: OptionKey }
type OptionKey = 'opening' | 'concert' | 'club'
type StepId = 'option' | 'event' | 'slot' | 'details' | 'summary'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatDate(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'pl-PL', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Europe/Warsaw',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function optionWindow(ev: AvailabilityEvent, option: OptionKey) {
  return ev.options[option]
}

export function ReservationModal({
  locale,
  preset,
  onClose,
}: {
  locale: Locale
  preset: ReservationPreset
  onClose: () => void
}) {
  const dict = getReservationDict(locale)

  const [events, setEvents] = useState<AvailabilityEvent[]>([])
  const [loading, setLoading] = useState(true)

  const [option, setOption] = useState<OptionKey | undefined>(preset.option)
  const [eventId, setEventId] = useState<number | undefined>(preset.eventId)
  const [guests, setGuests] = useState(2)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [consentTerms, setConsentTerms] = useState(false)
  const [consentNewsletter, setConsentNewsletter] = useState(true) // §7 default-on

  const [touched, setTouched] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successFree, setSuccessFree] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  // Visible steps depend on what the entry point already fixed.
  const steps = useMemo<StepId[]>(() => {
    const s: StepId[] = []
    if (!preset.option) s.push('option')
    if (!preset.eventId) s.push('event')
    s.push('slot', 'details', 'summary')
    return s
  }, [preset.option, preset.eventId])
  const [stepIndex, setStepIndex] = useState(0)
  const stepId = steps[stepIndex]

  useEffect(() => {
    let active = true
    fetch('/api/reservations/availability')
      .then((r) => r.json() as Promise<{ events: AvailabilityEvent[] }>)
      .then((data) => {
        if (active) setEvents(data.events || [])
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  // Esc closes (with guard).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') attemptClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched, successFree])

  const selectedEvent = events.find((e) => e.id === eventId)
  const eventsForOption = option
    ? events.filter((e) => optionWindow(e, option))
    : events
  const win = option && selectedEvent ? optionWindow(selectedEvent, option) : null
  const concertWin = option === 'concert' && selectedEvent ? selectedEvent.options.concert : null
  const pricePerPerson = concertWin?.pricePerPerson ?? 0
  const amount = pricePerPerson * guests
  const paid = amount > 0

  function markTouched() {
    if (!touched) setTouched(true)
  }

  function attemptClose() {
    if (successFree || !touched) {
      onClose()
      return
    }
    setShowCloseConfirm(true)
  }

  function goNext() {
    setFieldError(null)
    if (stepId === 'details') {
      if (!firstName || !lastName || !phone) return setFieldError(dict.validation.required)
      if (!EMAIL_REGEX.test(email)) return setFieldError(dict.validation.email)
      if (!consentTerms) return setFieldError(dict.validation.consent)
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  }
  function goBack() {
    setFieldError(null)
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  async function submit() {
    if (!eventId || !option || !win) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          option,
          slotStart: win.startTime,
          slotEnd: win.endTime,
          guests,
          firstName,
          lastName,
          phone,
          email,
          locale,
          consentTerms,
          consentNewsletter,
        }),
      })
      const data = (await res.json()) as {
        ok: boolean
        mode?: 'free' | 'paid'
        redirectUrl?: string
        error?: string
      }
      if (!res.ok || !data.ok) {
        setError(dict.errorGeneric)
        return
      }
      if (data.mode === 'paid' && data.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }
      setSuccessFree(true)
    } catch {
      setError(dict.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  const canNext =
    (stepId === 'option' && !!option) ||
    (stepId === 'event' && !!eventId) ||
    (stepId === 'slot' && guests >= 1) ||
    stepId === 'details'

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={attemptClose}
        aria-hidden
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={dict.title}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-brand-navy text-white shadow-2xl"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-brand-navy/95 px-6 py-4 backdrop-blur">
          <div>
            <h2 className="font-serif text-xl font-bold">{dict.title}</h2>
            {!successFree && (
              <p className="text-xs text-white/50">{dict.step(stepIndex + 1, steps.length)}</p>
            )}
          </div>
          <button
            onClick={attemptClose}
            aria-label={dict.buttons.close}
            className="text-2xl leading-none text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            {successFree ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-6"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 text-2xl text-emerald-400">
                  ✓
                </div>
                <h3 className="font-serif text-2xl font-bold">{dict.successFree.heading}</h3>
                <p className="mt-3 text-white/80">{dict.successFree.body}</p>
                <button
                  onClick={onClose}
                  className="mt-7 rounded-full bg-brand-gold px-8 py-3 font-semibold text-brand-navy"
                >
                  {dict.buttons.done}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={stepId}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
              >
                {stepId === 'option' && (
                  <div>
                    <h3 className="mb-4 font-serif text-lg font-semibold">{dict.options.heading}</h3>
                    <div className="space-y-3">
                      {(['opening', 'concert', 'club'] as OptionKey[]).map((key) => {
                        const o = dict.options[key]
                        const active = option === key
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setOption(key)
                              setEventId(undefined)
                              markTouched()
                            }}
                            className={`w-full rounded-xl border p-4 text-left transition ${
                              active
                                ? 'border-brand-gold bg-brand-gold/10'
                                : 'border-white/15 hover:border-white/30'
                            }`}
                          >
                            <div className="font-semibold">{o.label}</div>
                            <div className="mt-1 text-sm text-white/60">{o.info}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {stepId === 'event' && (
                  <div>
                    <h3 className="mb-1 font-serif text-lg font-semibold">{dict.pickEvent.heading}</h3>
                    {option === 'concert' && (
                      <p className="mb-3 text-xs text-white/50">{dict.pickEvent.concertOnlyNote}</p>
                    )}
                    {loading ? (
                      <p className="py-8 text-center text-white/50">…</p>
                    ) : eventsForOption.length === 0 ? (
                      <p className="py-8 text-center text-white/60">{dict.pickEvent.empty}</p>
                    ) : (
                      <div className="space-y-2">
                        {eventsForOption.map((e) => {
                          const active = eventId === e.id
                          return (
                            <button
                              key={e.id}
                              onClick={() => {
                                setEventId(e.id)
                                markTouched()
                              }}
                              className={`w-full rounded-xl border p-3 text-left transition ${
                                active
                                  ? 'border-brand-gold bg-brand-gold/10'
                                  : 'border-white/15 hover:border-white/30'
                              }`}
                            >
                              <div className="text-sm font-semibold">{e.title}</div>
                              <div className="text-xs text-white/55">{formatDate(e.dateISO, locale)}</div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {stepId === 'slot' && (
                  <div>
                    <h3 className="mb-4 font-serif text-lg font-semibold">{dict.slot.heading}</h3>
                    {selectedEvent && (
                      <p className="mb-4 text-sm text-white/70">
                        {selectedEvent.title} · {formatDate(selectedEvent.dateISO, locale)}
                      </p>
                    )}
                    {win && (
                      <p className="mb-5 text-sm text-white/60">
                        {dict.slot.window}: {win.startTime}–{win.endTime}
                      </p>
                    )}
                    <label className="mb-2 block text-sm text-white/70">{dict.slot.guests}</label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuests((g) => Math.max(1, g - 1))}
                        className="h-10 w-10 rounded-full border border-white/20 text-xl"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-lg font-semibold">{guests}</span>
                      <button
                        onClick={() => setGuests((g) => g + 1)}
                        className="h-10 w-10 rounded-full border border-white/20 text-xl"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {stepId === 'details' && (
                  <div>
                    <h3 className="mb-4 font-serif text-lg font-semibold">{dict.details.heading}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={dict.details.firstName} value={firstName} onChange={(v) => { setFirstName(v); markTouched() }} />
                      <Input label={dict.details.lastName} value={lastName} onChange={(v) => { setLastName(v); markTouched() }} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Input label={dict.details.phone} value={phone} onChange={(v) => { setPhone(v); markTouched() }} type="tel" />
                      <Input label={dict.details.email} value={email} onChange={(v) => { setEmail(v); markTouched() }} type="email" />
                    </div>
                    <label className="mt-4 flex items-start gap-2 text-sm text-white/75">
                      <input type="checkbox" checked={consentTerms} onChange={(e) => { setConsentTerms(e.target.checked); markTouched() }} className="mt-1" />
                      <span>{dict.details.consentTerms}</span>
                    </label>
                    <label className="mt-3 flex items-start gap-2 text-sm text-white/75">
                      <input type="checkbox" checked={consentNewsletter} onChange={(e) => setConsentNewsletter(e.target.checked)} className="mt-1" />
                      <span>{dict.details.consentNewsletter}</span>
                    </label>
                  </div>
                )}

                {stepId === 'summary' && (
                  <div>
                    <h3 className="mb-4 font-serif text-lg font-semibold">{dict.summary.heading}</h3>
                    <dl className="space-y-2 text-sm">
                      <Row k={dict.summary.option} v={option ? dict.options[option].label : ''} />
                      <Row k={dict.summary.date} v={selectedEvent ? formatDate(selectedEvent.dateISO, locale) : ''} />
                      {win && <Row k={dict.summary.time} v={`${win.startTime}–${win.endTime}`} />}
                      <Row k={dict.summary.guests} v={String(guests)} />
                      <Row
                        k={dict.summary.price}
                        v={paid ? `${amount} PLN (${pricePerPerson} PLN ${dict.summary.perPerson})` : dict.summary.free}
                      />
                    </dl>
                    {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
                  </div>
                )}

                {fieldError && <p className="mt-4 text-sm text-red-400">{fieldError}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        {!successFree && (
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-white/10 bg-brand-navy/95 px-6 py-4 backdrop-blur">
            <button
              onClick={goBack}
              disabled={stepIndex === 0}
              className="rounded-full px-5 py-2.5 text-sm text-white/70 disabled:opacity-30 hover:text-white"
            >
              {dict.buttons.back}
            </button>
            {stepId === 'summary' ? (
              <button
                onClick={submit}
                disabled={submitting}
                className="rounded-full bg-brand-gold px-7 py-2.5 text-sm font-semibold text-brand-navy disabled:opacity-60"
              >
                {submitting ? dict.submitting : paid ? dict.buttons.submitPaid : dict.buttons.submitFree}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!canNext}
                className="rounded-full bg-brand-gold px-7 py-2.5 text-sm font-semibold text-brand-navy disabled:opacity-40"
              >
                {dict.buttons.next}
              </button>
            )}
          </div>
        )}

        {/* Close confirm (in-app, not beforeunload) */}
        <AnimatePresence>
          {showCloseConfirm && (
            <motion.div
              className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/80 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-full max-w-sm rounded-xl border border-white/10 bg-brand-navy p-6 text-center">
                <h4 className="font-serif text-lg font-semibold">{dict.closeConfirm.heading}</h4>
                <p className="mt-2 text-sm text-white/70">{dict.closeConfirm.body}</p>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    onClick={() => setShowCloseConfirm(false)}
                    className="rounded-full border border-white/20 px-5 py-2 text-sm"
                  >
                    {dict.closeConfirm.stay}
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-full bg-red-500/90 px-5 py-2 text-sm font-semibold text-white"
                  >
                    {dict.closeConfirm.leave}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-white/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand-gold"
      />
    </label>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
      <dt className="text-white/55">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  )
}
