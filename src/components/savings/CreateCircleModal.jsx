import { useState } from 'react'
import Icon from '../icons'
import { savings } from '../../api/client'
import { AppButton } from '../ui/AppButton'
import { Modal } from '../ui/Modal'

const PERIODS = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'bi-weekly', label: 'Every 2 weeks' },
  { id: 'monthly', label: 'Monthly' },
]

/**
 * Creates a new savings circle. Private circles get an invite link returned
 * after creation so members can be added by email.
 */
export function CreateCircleModal({ open, onClose, onCreate, token }) {
  const [draft, setDraft] = useState({
    name: '',
    weekly: '200',
    members: 12,
    period: 'weekly',
    visibility: 'Public',
    description: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  const amountOk = Number(draft.weekly) > 0 && Number.isFinite(Number(draft.weekly))
  const canCreate = draft.name.trim().length > 0 && amountOk

  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }))

  const reset = () => {
    setDraft({ name: '', weekly: '200', members: 12, period: 'weekly', visibility: 'Public', description: '' })
    setBusy(false)
    setError('')
    setCreated(null)
  }

  const close = () => {
    reset()
    onClose?.()
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!canCreate || busy) return
    setBusy(true)
    setError('')
    try {
      const result = await savings.create(
        {
          name: draft.name,
          weekly: Number(draft.weekly),
          members: Number(draft.members) || 12,
          period: draft.period,
          visibility: draft.visibility,
          description: draft.description,
        },
        token
      )
      setCreated(result)
      onCreate?.(result)
    } catch (err) {
      setError(err.message || 'Could not create the circle')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link)
      setError('')
    } catch {
      setError('')
    }
  }

  return (
    <Modal open={open} title={created ? 'Circle created' : 'Start a savings circle'} onClose={close} wide>
      {!created ? (
        <form className="grid gap-4" onSubmit={submit}>
          <p className="m-0 text-sm leading-6 text-muted">
            Launch your own susu circle. Public circles are discoverable by everyone; private ones
            only accept people you invite.
          </p>

          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Circle name
            <input
              type="text"
              placeholder="e.g. Bawumia Market Traders"
              value={draft.name}
              onChange={(e) => set('name', e.target.value)}
              className="rounded-xl border border-line bg-white px-3 py-2.5 text-base font-medium text-ink"
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Weekly amount (GH₵)
              <input
                type="number"
                min="10"
                step="10"
                value={draft.weekly}
                onChange={(e) => set('weekly', e.target.value)}
                className="rounded-xl border border-line bg-white px-3 py-2.5 text-base font-medium text-ink"
                required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Pay cycle
              <select
                value={draft.period}
                onChange={(e) => set('period', e.target.value)}
                className="rounded-xl border border-line bg-white px-3 py-2.5 text-base font-medium text-ink"
              >
                {PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Members
              <input
                type="number"
                min="2"
                max="60"
                value={draft.members}
                onChange={(e) => set('members', e.target.value)}
                className="rounded-xl border border-line bg-white px-3 py-2.5 text-base font-medium text-ink"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {['Public', 'Private'].map((vis) => (
              <button
                key={vis}
                type="button"
                onClick={() => set('visibility', vis)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 ${
                  draft.visibility === vis
                    ? 'border-prospera bg-prospera-soft'
                    : 'border-line bg-canvas'
                }`}
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                    vis === 'Public' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Icon name={vis === 'Public' ? 'usersPlus' : 'lock'} size={17} />
                </span>
                <span>
                  <strong className="block text-ink-strong">{vis}</strong>
                  <span className="text-xs text-muted">
                    {vis === 'Public'
                      ? 'Anyone can see and join'
                      : 'Only invited people can join'}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <label className="grid gap-1.5 text-sm font-semibold text-ink">
            Description (optional)
            <textarea
              rows={2}
              placeholder="What kind of people is this circle for?"
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              className="resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-base font-medium text-ink"
            />
          </label>

          {error && <p className="m-0 text-sm font-semibold text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <AppButton type="submit" disabled={!canCreate || busy}>
              {busy ? 'Creating…' : 'Create circle'}
            </AppButton>
            <AppButton variant="outline" onClick={close}>
              Cancel
            </AppButton>
          </div>
        </form>
      ) : (
        <div className="grid gap-4">
          <p className="m-0 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
            <strong className="block">{created.circle.name}</strong>
            {created.circle.visibility === 'Private'
              ? 'It is private. Share the invite link with the people you want in.'
              : 'It is public, so anyone can join it from Discover circles.'}
          </p>

          {created.invite?.link && (
            <button
              type="button"
              onClick={() => void copyLink(created.invite.link)}
              className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2.5 text-left text-sm text-ink transition hover:border-ink-strong"
            >
              <Icon name="copy" size={15} />
              <span className="min-w-0 flex-1 truncate">{created.invite.link}</span>
              <span className="shrink-0 font-semibold text-prospera">Copy</span>
            </button>
          )}

          <AppButton onClick={close}>Done</AppButton>
        </div>
      )}
    </Modal>
  )
}

export default CreateCircleModal