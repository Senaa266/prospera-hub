import { useMemo, useState } from 'react'
import Icon from '../icons'
import { savings } from '../../api/client'
import { AppButton } from '../ui/AppButton'

/**
 * Transparency widget: recalc what everyone would receive if a member stops
 * paying, using the live rotation plan from the server.
 */
export function CircleHealthPanel({ circle, token, onPaid }) {
  const members = circle.roster || []
  const [memberId, setMemberId] = useState('')
  const [missed, setMissed] = useState('1')
  const [plan, setPlan] = useState(circle.plan || null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [simulated, setSimulated] = useState(false)

  const simulate = async () => {
    if (!memberId || busy) return
    setBusy(true)
    setError('')
    try {
      const result = await savings.simulate(
        circle.id,
        { memberId: Number(memberId), missed: Number(missed) || 0 },
        token
      )
      setPlan(result.plan)
      setSimulated(true)
    } catch (err) {
      setError(err.message || 'Could not run the scenario')
    } finally {
      setBusy(false)
    }
  }

  const planMembers = useMemo(() => plan?.members || [], [plan])
  const impact = plan?.impact || circle.plan?.impact || ''

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
        <label className="grid gap-1.5 text-sm font-semibold text-ink">
          Member who stops paying
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-base font-medium text-ink"
          >
            <option value="">Choose a member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-ink">
          Missed cycles
          <select
            value={missed}
            onChange={(e) => setMissed(e.target.value)}
            className="rounded-xl border border-line bg-white px-3 py-2.5 text-base font-medium text-ink"
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <AppButton onClick={simulate} disabled={!memberId || busy}>
            {busy ? 'Recalculating…' : 'Run scenario'}
          </AppButton>
        </div>
      </div>

      {error && <p className="m-0 mt-3 text-sm font-semibold text-red-600">{error}</p>}

      {plan && (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl bg-canvas px-4 py-3 text-sm">
            <span className="font-semibold text-ink">
              Next payout to <strong className="text-prospera">{plan.nextRecipient}</strong>
            </span>
            <span className="rounded-lg bg-ink-strong px-2.5 py-1 text-xs font-bold text-white">
              {`GH₵ ${(plan.nextAmount || 0).toLocaleString()}`}
            </span>
            <span className="text-muted">
              from a pot of {`GH₵ ${plan.pot.toLocaleString()}`} · {plan.paidCount} paid this cycle
            </span>
          </div>

          <p className="m-0 mb-3 flex items-start gap-2 text-sm leading-6 text-muted">
            <Icon name="info" size={15} className="mt-0.5 shrink-0" />
            {impact}
          </p>

          <div className="grid gap-1.5">
            {planMembers.map((m) => {
              const isSkipped = m.backOfQueue
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                    isSkipped ? 'bg-red-50' : 'bg-white'
                  }`}
                >
                  <span className="w-7 shrink-0 text-center text-xs font-bold text-muted">
                    {m.projectedOrder}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-strong">
                    {m.name}
                    {isSkipped && (
                      <span className="ml-2 rounded-md bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                        moved to back
                      </span>
                    )}
                  </span>
                  <span className={`shrink-0 text-sm font-semibold ${m.payout ? 'text-emerald-700' : 'text-muted'}`}>
                    {m.payout ? `GH₵ ${m.payout.toLocaleString()}` : '—'}
                  </span>
                </div>
              )
            })}
          </div>

          {circle.isCreator && plan && !simulated && plan.nextRecipient && (
            <AppButton
              variant="dark"
              className="mt-4"
              onClick={() => {
                if (window.confirm(`Pay out GH₵ ${plan.nextAmount?.toLocaleString()} to ${plan.nextRecipient} now?`)) {
                  onPaid?.()
                }
              }}
            >
              <Icon name="bank" size={16} />
              Run next payout
            </AppButton>
          )}
        </div>
      )}
    </div>
  )
}

export default CircleHealthPanel