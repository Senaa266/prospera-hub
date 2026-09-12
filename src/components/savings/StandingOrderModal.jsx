import { useState } from 'react'
import Icon from '../icons'
import { AppButton } from '../ui/AppButton'
import { Modal } from '../ui/Modal'

const RAILS = [
  {
    id: 'momo',
    label: 'Mobile Money',
    providers: [
      { id: 'mtn', name: 'MTN MoMo' },
      { id: 'telecel', name: 'Telecel Cash' },
    ],
  },
  {
    id: 'bank',
    label: 'Bank transfer',
    providers: [
      { id: 'absa', name: 'Absa' },
      { id: 'fidelity', name: 'Fidelity' },
      { id: 'gcb', name: 'GCB' },
    ],
  },
]

/**
 * Demo standing-order / auto-debit mandate for weekly susu contributions.
 */
export function StandingOrderModal({ open, onClose, circleId, circleName, weekly, onSave }) {
  const [railId, setRailId] = useState('momo')
  const [providerId, setProviderId] = useState('mtn')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')

  const rail = RAILS.find((r) => r.id === railId) || RAILS[0]
  const provider = rail.providers.find((p) => p.id === providerId) || rail.providers[0]

  const submit = (event) => {
    event.preventDefault()
    if (reference.trim().length < 8) {
      setError('Enter a valid MoMo number or account (min 8 digits).')
      return
    }
    onSave?.({
      circleId,
      provider: provider.name,
      rail: rail.label,
      reference: reference.trim(),
      amount: weekly,
      cadence: 'weekly',
    })
    setError('')
    setReference('')
    onClose?.()
  }

  return (
    <Modal open={open} title="Automate weekly contribution" onClose={onClose}>
      <form className="grid gap-4" onSubmit={submit}>
        <p className="m-0 rounded-2xl bg-canvas px-4 py-3 text-sm leading-6 text-muted">
          Standing orders for <strong className="text-ink">{circleName}</strong> auto-debit{' '}
          <strong className="text-ink">GH₵ {weekly}</strong> so the circle is not exposed to accidental or intentional
          drop-offs. Demo only — no live debit.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {RAILS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setRailId(item.id)
                setProviderId(item.providers[0].id)
              }}
              className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                railId === item.id
                  ? 'border-prospera bg-prospera-soft text-ink-strong'
                  : 'border-line bg-card text-muted hover:border-prospera/40'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="grid gap-1.5 text-sm font-semibold text-ink">
          Provider
          <select
            value={providerId}
            onChange={(e) => setProviderId(e.target.value)}
            className="rounded-xl border border-line bg-card px-3 py-2.5 font-medium text-ink"
          >
            {rail.providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-ink">
          {railId === 'momo' ? 'Mobile number' : 'Account number'}
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={railId === 'momo' ? '024 XXX XXXX' : 'Account number'}
            className="rounded-xl border border-line bg-card px-3 py-2.5 font-medium text-ink"
            required
          />
        </label>

        {error ? (
          <p className="m-0 text-sm font-medium text-rose-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <AppButton type="submit">
            <Icon name="shield" size={15} />
            Activate mandate
          </AppButton>
          <AppButton type="button" variant="outline" onClick={onClose}>
            Cancel
          </AppButton>
        </div>
      </form>
    </Modal>
  )
}

export default StandingOrderModal
