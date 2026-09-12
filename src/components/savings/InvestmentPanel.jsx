import { useState } from 'react'
import Icon from '../icons'
import { savings } from '../../api/client'
import { AppButton } from '../ui/AppButton'

function pct(part, whole) {
  return Math.min(100, Math.round((part / Math.max(whole, 1)) * 100))
}

/**
 * Investment unlock + vault. Investments only appear once the in-app savings
 * balance crosses the threshold set on the server.
 */
export function InvestmentPanel({ account, vault = [], investments = [], token, onChanged }) {
  const [offerId, setOfferId] = useState('')
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const offer = vault.find((v) => v.id === offerId)
  const n = Number(amount)
  const amountOk = offer ? Number.isFinite(n) && n >= offer.min : false

  const invest = async () => {
    if (!offer || !amountOk || busy) return
    setBusy(true)
    setError('')
    try {
      await savings.invest({ providerId: offer.id, name: label.trim(), amount: n }, token)
      setAmount('')
      setLabel('')
      setBusy(false)
      onChanged?.()
    } catch (err) {
      setError(err.message || 'Investment failed')
      setBusy(false)
    }
  }

  const claim = async (id) => {
    try {
      await savings.claim(id, token)
      onChanged?.()
    } catch (err) {
      setError(err.message || 'Could not claim returns')
    }
  }

  if (!account.unlocked) {
    const gap = Math.max(0, account.investmentThreshold - account.balance)
    return (
      <div className="inv-panel locked">
        <div className="inv-locked-icon">
          <Icon name="lock" size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block text-ink-strong">Investments unlock at savings of {`GH₵ ${account.investmentThreshold.toLocaleString()}`}</strong>
          <p className="m-0 mt-1 text-sm leading-6 text-muted">
            Save {`GH₵ ${gap.toLocaleString()}`} more across circles and personal goals to unlock
            the collaboration investment vault.
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-prospera to-brand-indigo transition-all"
              style={{ width: `${pct(account.balance, account.investmentThreshold)}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 grid gap-6 md:grid-cols-2">
        {vault.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              setOfferId(offerId === v.id ? '' : v.id)
              setAmount('')
              if (offerId === v.id) setLabel('')
            }}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
              offerId === v.id ? 'border-prospera bg-prospera-soft' : 'border-line bg-white'
            }`}
          >
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white ${
                offerId === v.id ? 'bg-prospera' : 'bg-ink-strong'
              }`}
            >
              <Icon name="percent" size={19} />
            </span>
            <span className="min-w-0">
              <strong className="block text-ink-strong">{v.provider}</strong>
              <span className="mt-0.5 block text-xs leading-5 text-muted">{v.desc}</span>
              <span className="mt-2 inline-flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-lg bg-canvas px-2 py-1 text-ink">{v.rate}% / {v.term} mo</span>
                <span className="rounded-lg bg-canvas px-2 py-1 text-ink">Min {`GH₵ ${v.min.toLocaleString()}`}</span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {offer && (
        <div className="mb-5 rounded-2xl border border-line bg-white p-4">
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Amount (min {`GH₵ ${offer.min}`})
              <input
                type="number"
                min={offer.min}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl border border-line bg-white px-3 py-2.5 text-base font-medium text-ink"
                placeholder={`GH₵ ${offer.min}`}
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-ink">
              Label (optional)
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="rounded-xl border border-line bg-white px-3 py-2.5 text-base font-medium text-ink"
                placeholder="e.g. Stock restocking"
              />
            </label>
          </div>
          <p className="m-0 text-xs leading-5 text-muted">
            At {offer.rate}% over {offer.term} months, this will return about {`GH₵ ${Math.round(
              n && n >= offer.min ? n + (n * offer.rate * offer.term) / 1200 : offer.min + (offer.min * offer.rate * offer.term) / 1200
            ).toLocaleString()}`} when the term completes.
          </p>
          {error && <p className="m-0 mt-2 text-sm font-semibold text-red-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            <AppButton onClick={invest} disabled={!amountOk || busy}>
              {busy ? 'Investing…' : 'Start investment'}
            </AppButton>
            <AppButton variant="outline" onClick={() => setOfferId('')}>
              Cancel
            </AppButton>
          </div>
        </div>
      )}

      {investments.length > 0 && (
        <div className="grid gap-3">
          {investments.map((inv) => {
            const termDone = inv.status === 'completed'
            return (
              <div
                key={inv.id}
                className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${
                  termDone ? 'border-line bg-canvas' : 'border-line bg-white'
                }`}
              >
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    termDone ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Icon name={termDone ? 'check' : 'clock'} size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-ink-strong">
                    {inv.name} · {inv.provider}
                  </strong>
                  <span className="text-xs text-muted">
                    {`GH₵ ${inv.amount.toLocaleString()}`} @ {inv.rate}% · {inv.term} months
                    {inv.status === 'completed' ? ' · returns paid out' : ` · started ${inv.createdAt}`}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block text-sm font-bold text-prospera">
                    +{`GH₵ ${(inv.returnAmount - inv.amount).toLocaleString()}`}
                  </span>
                  {termDone ? (
                    <span className="text-xs font-semibold text-emerald-700">Collected</span>
                  ) : (
                    <span className="text-xs text-muted">return in {inv.term} months</span>
                  )}
                </div>
                {termDone && (
                  <button
                    type="button"
                    onClick={() => void claim(inv.id)}
                    className="shrink-0 rounded-xl border border-line bg-canvas px-3 py-1.5 text-xs font-bold text-ink transition hover:border-ink-strong"
                  >
                    Collect returns
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default InvestmentPanel