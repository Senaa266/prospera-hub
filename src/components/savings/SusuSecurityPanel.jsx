import Icon from '../icons'
import { AppButton } from '../ui/AppButton'
import { AppCard } from '../ui/AppCard'
import { ProgressBar } from '../ui/ProgressBar'
import { useSusuSecurity } from '../../context/SusuSecurityContext'
import { fmt } from '../../data/savings'
import { trustBand, STATUTORY_DEFAULT_FEE_RATE } from '../../lib/susuProtection'

/**
 * Platform-wide susu security overview: deficits, wallets, restrictions, audit.
 */
export function SusuSecurityOverview({ onOpenMandate }) {
  const {
    openDeficit,
    restrictions,
    personalWallet,
    grantWallet,
    audit,
    settleOpenDeficit,
    clearDemoProtection,
    mandates,
  } = useSusuSecurity()

  return (
    <div className="mb-6 grid gap-4">
      {!restrictions.canAccessGrants ? (
        <div
          className="flex flex-wrap items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
          role="alert"
        >
          <Icon name="shield" size={18} />
          <div className="min-w-0 flex-1">
            <p className="m-0 font-bold">Platform restrictions active</p>
            <p className="mb-0 mt-1 leading-6">{restrictions.message}</p>
          </div>
          {openDeficit ? (
            <AppButton variant="danger" className="text-xs" onClick={settleOpenDeficit}>
              Settle now
            </AppButton>
          ) : null}
        </div>
      ) : null}

      <AppCard className="hover:!translate-y-0">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-bold uppercase tracking-wide text-prospera">Circle protection</p>
            <h2 className="mb-1 mt-1 text-lg font-bold text-ink-strong">Zero-loss susu framework</h2>
            <p className="m-0 max-w-2xl text-sm leading-6 text-muted">
              Hit-and-run defaults trigger collateral clawback, security-pool cover, and transparent temporary
              surcharges so other members are not left holding the loss. Statutory fee:{' '}
              {Math.round(STATUTORY_DEFAULT_FEE_RATE * 100)}%.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AppButton variant="dark" className="text-xs" onClick={onOpenMandate}>
              Set standing order
            </AppButton>
            <AppButton variant="ghost" className="text-xs" onClick={clearDemoProtection}>
              Reset demo
            </AppButton>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-canvas px-3 py-3">
            <span className="text-xs font-semibold text-muted">Personal wallet</span>
            <strong className="mt-1 block text-lg text-ink-strong">{fmt(personalWallet)}</strong>
          </div>
          <div className="rounded-xl bg-canvas px-3 py-3">
            <span className="text-xs font-semibold text-muted">Grant wallet</span>
            <strong className="mt-1 block text-lg text-ink-strong">{fmt(grantWallet)}</strong>
          </div>
          <div className="rounded-xl bg-canvas px-3 py-3">
            <span className="text-xs font-semibold text-muted">Active mandates</span>
            <strong className="mt-1 block text-lg text-ink-strong">
              {mandates.filter((m) => m.status === 'active').length}
            </strong>
          </div>
        </div>

        {openDeficit ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="m-0 text-sm font-bold text-amber-950">
                  Open deficit · {openDeficit.memberName}
                </p>
                <p className="mb-0 mt-1 text-sm text-amber-900">
                  Principal {fmt(openDeficit.outstandingPrincipal)} + fee {fmt(openDeficit.defaultFee)} ={' '}
                  <strong>{fmt(openDeficit.totalOwed)}</strong>
                </p>
              </div>
              <AppButton variant="dark" className="text-xs" onClick={settleOpenDeficit}>
                Claw back from wallets
              </AppButton>
            </div>
          </div>
        ) : (
          <p className="mb-0 mt-4 text-sm text-muted">No open hit-and-run deficits. Circles are fully protected.</p>
        )}

        {audit?.length ? (
          <ul className="mb-0 mt-4 grid list-none gap-2 p-0">
            {audit.slice(0, 3).map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-line bg-card px-3 py-2 text-xs leading-5 text-muted"
              >
                <span className="font-semibold text-ink">{row.type}</span> · {row.text}
              </li>
            ))}
          </ul>
        ) : null}
      </AppCard>
    </div>
  )
}

/**
 * Per-circle trust, payout priority, and default simulation controls.
 */
export function CircleProtectionPanel({ circleId, weekly }) {
  const {
    getCircle,
    simulatePeerDefault,
    simulateSelfDefault,
    lockCollateralForYou,
    mandates,
  } = useSusuSecurity()
  const circle = getCircle(circleId)
  if (!circle) return null

  const mandate = mandates.find((m) => m.circleId === circleId && m.status === 'active')
  const top = circle.members.slice(0, 6)

  return (
    <div className="panel transparency-panel">
      <div className="panel-head">
        <h3>Protection & payout priority</h3>
        <span className="streak-chip">
          <Icon name="shield" size={12} />
          Trust engine
        </span>
      </div>
      <div className="panel-body">
        <p className="panel-sub">
          Early slots favour high consistency and verified credentials. Riskier profiles get later slots or staggered
          milestones. Security pool: <strong>{fmt(circle.sharedSecurityPool)}</strong>
          {circle.surchargePerMember > 0
            ? ` · Temporary surcharge ${fmt(circle.surchargePerMember)}/member`
            : null}
        </p>

        {mandate ? (
          <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Mandate on: {mandate.provider} · GH₵ {mandate.amount}/{mandate.cadence}
          </p>
        ) : null}

        {circle.lastReallocation ? (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-3 text-sm text-emerald-950">
            <strong>Last zero-loss reallocation</strong>
            <p className="mb-0 mt-1 leading-6">{circle.lastReallocation.explanation}</p>
          </div>
        ) : null}

        <div className="mb-3 flex flex-wrap gap-2">
          <AppButton variant="outline" className="text-xs" onClick={() => lockCollateralForYou(circleId)}>
            Lock my collateral
          </AppButton>
          <AppButton variant="outline" className="text-xs" onClick={() => simulatePeerDefault(circleId)}>
            Simulate peer default
          </AppButton>
          <AppButton variant="danger" className="text-xs" onClick={() => simulateSelfDefault(circleId)}>
            Simulate my hit-and-run
          </AppButton>
        </div>

        <div className="roster" role="list">
          {top.map((m) => {
            const band = trustBand(m.trustScore)
            return (
              <div className={`roster-item ${m.status === 'deficit' ? '' : m.paid ? 'paid' : ''}`} key={m.id}>
                <span className="roster-avatar">{m.name[0]}</span>
                <span className="roster-name">
                  {m.name}
                  <span className="mt-0.5 block text-[11px] font-medium text-muted">
                    Slot #{m.payoutSlot} · {m.distribution} · collateral {fmt(m.collateralLocked || 0)}
                  </span>
                </span>
                <span className="flex min-w-[7rem] flex-col items-end gap-1">
                  <span
                    className={`pay-chip ${
                      m.status === 'deficit' ? 'missed' : band.tone === 'emerald' ? 'paid' : 'missed'
                    }`}
                  >
                    Trust {m.trustScore}
                  </span>
                  <span className="w-20">
                    <ProgressBar value={m.trustScore} label={`${m.name} trust`} />
                  </span>
                </span>
              </div>
            )
          })}
        </div>
        <p className="mb-0 mt-3 text-xs text-muted">
          Weekly contribution reference GH₵ {weekly}. Demo simulations update local protection state only.
        </p>
      </div>
    </div>
  )
}

export default SusuSecurityOverview
