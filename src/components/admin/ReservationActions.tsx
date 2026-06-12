'use client'

import { useEffect, useState } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

// Moderation buttons rendered on the Reservation edit view (spec §5):
// Zatwierdź / Odrzuć (+ zwrot) / Zwróć i anuluj. Each calls the matching
// admin-only collection endpoint, then reloads the document.

type ActionKey = 'approve' | 'reject' | 'cancel'

const CONFIRM: Record<ActionKey, string> = {
  approve: 'Zatwierdzić tę rezerwację? Klient otrzyma SMS i e-mail.',
  reject: 'Odrzucić tę rezerwację? Jeśli była opłacona, środki zostaną zwrócone.',
  cancel: 'Anulować tę rezerwację? Jeśli była opłacona, środki zostaną zwrócone.',
}

export function ReservationActions() {
  const { id } = useDocumentInfo()
  const status = useFormFields(([fields]) => fields?.status?.value as string | undefined)
  const paymentStatus = useFormFields(([fields]) => fields?.paymentStatus?.value as string | undefined)
  const [busy, setBusy] = useState<ActionKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [capacity, setCapacity] = useState<{ used: number; capacity: number | null; over: boolean } | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/reservations/${id}/capacity`, { credentials: 'include' })
      .then((r) => r.json() as Promise<{ used: number; capacity: number | null; over: boolean }>)
      .then(setCapacity)
      .catch(() => {})
  }, [id])

  if (!id) {
    return (
      <p style={{ color: 'var(--theme-elevation-500)', fontSize: 13 }}>
        Akcje moderacji pojawią się po zapisaniu rezerwacji.
      </p>
    )
  }

  const isPaid = paymentStatus === 'paid'

  async function run(action: ActionKey) {
    if (!window.confirm(CONFIRM[action])) return
    setBusy(action)
    setError(null)
    try {
      const res = await fetch(`/api/reservations/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error || 'Akcja nie powiodła się.')
        setBusy(null)
        return
      }
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Akcja nie powiodła się.')
      setBusy(null)
    }
  }

  const canApprove = status === 'awaiting_approval'
  const canReject = status === 'awaiting_approval' || status === 'awaiting_payment'
  const canCancel = status === 'confirmed' || status === 'awaiting_approval'
  const terminal = status === 'rejected' || status === 'cancelled' || status === 'abandoned'

  const btn: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 4,
    border: '1px solid var(--theme-elevation-150)',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ margin: '0 0 8px' }}>Moderacja</h4>
      {capacity && capacity.capacity != null && (
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            margin: '0 0 10px',
            color: capacity.over ? '#b91c1c' : 'var(--theme-elevation-600)',
          }}
        >
          Obłożenie wydarzenia: {capacity.used}/{capacity.capacity} osób
          {capacity.over ? ' — przekroczono pojemność!' : ''}
        </p>
      )}
      {terminal ? (
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: 13 }}>
          Rezerwacja zakończona (status: {status}). Brak dostępnych akcji.
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {canApprove && (
            <button
              type="button"
              onClick={() => run('approve')}
              disabled={busy !== null}
              style={{ ...btn, background: '#15803d', color: '#fff', borderColor: '#15803d' }}
            >
              {busy === 'approve' ? '…' : 'Zatwierdź'}
            </button>
          )}
          {canReject && (
            <button
              type="button"
              onClick={() => run('reject')}
              disabled={busy !== null}
              style={{ ...btn, background: '#b91c1c', color: '#fff', borderColor: '#b91c1c' }}
            >
              {busy === 'reject' ? '…' : isPaid ? 'Odrzuć i zwróć' : 'Odrzuć'}
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => run('cancel')}
              disabled={busy !== null}
              style={btn}
            >
              {busy === 'cancel' ? '…' : isPaid ? 'Zwróć i anuluj' : 'Anuluj'}
            </button>
          )}
        </div>
      )}
      {error && <p style={{ color: '#b91c1c', fontSize: 13, marginTop: 8 }}>{error}</p>}
    </div>
  )
}
