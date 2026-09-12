import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/icons'
import AIOffer from '../components/AIOffer'
import ContributePaymentModal from '../components/savings/ContributePaymentModal'
import StandingOrderModal from '../components/savings/StandingOrderModal'
import { CircleProtectionPanel } from '../components/savings/SusuSecurityPanel'
import { AppButton } from '../components/ui/AppButton'
import { PageShell } from '../components/ui/PageShell'
import { useSusuSecurity } from '../context/SusuSecurityContext'
import { GROUPS, fmt, getJoined, setJoined } from '../data/savings'
import './Feature.css'

function SavingsDetail() {
  const { id } = useParams()
  const group = GROUPS.find((g) => g.id === id)
  const [joined, setJoinedState] = useState(getJoined().includes(id))
  const [contributed, setContributed] = useState(0)
  const [payOpen, setPayOpen] = useState(false)
  const [mandateOpen, setMandateOpen] = useState(false)
  const [joinError, setJoinError] = useState('')
  const { restrictions, enableMandate, getCircle } = useSusuSecurity()
  const protection = group ? getCircle(group.id) : null

  if (!group) {
    return (
      <PageShell>
        <Link to="/savings" className="detail-back">
          <Icon name="chevron" size={16} />
          Back to savings
        </Link>
        <div className="empty-state featured-empty">
          <p>We couldn&apos;t find that savings circle.</p>
          <Link to="/savings" className="btn-primary-dark">
            Browse circles
          </Link>
        </div>
      </PageShell>
    )
  }

  const toggleJoin = () => {
    setJoinError('')
    if (!joined && !restrictions.canJoinSavingsCircle) {
      setJoinError(restrictions.message)
      return
    }
    const current = getJoined()
    const next = joined ? current.filter((x) => x !== id) : [...current, id]
    setJoined(next)
    setJoinedState(!joined)
  }

  const cyclePct = Math.round((group.filled / group.members) * 100)
  const totalSaved = (group.youSaved || 0) + contributed
  const priorityPreview = (protection?.members || [])
    .slice(0, 3)
    .map((m) => ({ pos: `Slot #${m.payoutSlot}`, who: m.name, when: m.distribution }))

  const stats = [
    { icon: 'wallet', label: 'Contribution', value: group.amount.split(' /')[0], cap: `${group.cycle} per slot`, hue: 'pink' },
    { icon: 'clock', label: 'Next payout', value: group.nextPayout, cap: `${group.filled} payments in`, hue: 'yellow' },
    { icon: 'users', label: 'Members', value: String(group.members), cap: `${group.members - group.filled} still to pay`, hue: 'blue' },
    {
      icon: 'shield',
      label: 'Security pool',
      value: protection ? fmt(protection.sharedSecurityPool) : '—',
      cap: protection?.surchargePerMember ? `+${fmt(protection.surchargePerMember)} surcharge` : 'Zero-loss cover',
      hue: 'green',
    },
  ]

  return (
    <PageShell>
      <Link to="/savings" className="detail-back">
        <Icon name="chevron" size={16} />
        Back to savings
      </Link>

      <div className="detail-head">
        <div>
          <div className="detail-title-row">
            <h1>{group.name}</h1>
            <span className={`status-chip ${joined ? '' : 'join'}`}>
              <span className="status-dot" />
              {joined ? 'Member' : 'Not joined'}
            </span>
          </div>
          <p className="feature-sub">{group.description}</p>
        </div>
        <span className="pot-chip">
          <Icon name="wallet" size={15} />
          {group.balance}
        </span>
      </div>

      {joinError ? (
        <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800" role="alert">
          {joinError}
        </p>
      ) : null}

      <div className="detail-stats">
        {stats.map((s) => (
          <div className="detail-stat" key={s.label}>
            <div className="ds-top">
              <span className={`ds-icon c-${s.hue}`}>
                <Icon name={s.icon} size={17} />
              </span>
              <span className="ds-label">{s.label}</span>
            </div>
            <strong>{s.value}</strong>
            <em>{s.cap}</em>
          </div>
        ))}
      </div>

      <div className="detail-grid">
        <CircleProtectionPanel circleId={group.id} weekly={group.weekly} />

        <div className="detail-side">
          <div className="panel contribution-panel">
            <div className="panel-head">
              <h3>My contribution</h3>
            </div>
            <div className="panel-body">
              {joined ? (
                <>
                  <div className="contribution-amount">
                    <strong>{fmt(totalSaved)}</strong>
                    <span>saved in this circle</span>
                  </div>
                  <div className="contribution-rows">
                    <div className="contribution-row">
                      <span>On-time streak</span>
                      <b>
                        <Icon name="check" size={13} />
                        {group.streak}
                      </b>
                    </div>
                    <div className="contribution-row">
                      <span>Next auto-debit</span>
                      <b>Standing order</b>
                    </div>
                  </div>
                  <button type="button" className="btn-join detail-contribute" onClick={() => setPayOpen(true)}>
                    <Icon name="wallet" size={15} />
                    Contribute GH₵ {group.weekly}
                  </button>
                  <AppButton variant="outline" className="mt-2 w-full text-xs" onClick={() => setMandateOpen(true)}>
                    <Icon name="shield" size={14} />
                    Automate with MoMo / bank
                  </AppButton>
                </>
              ) : (
                <>
                  <div className="contribution-amount">
                    <strong>Join to contribute</strong>
                    <span>and track your savings</span>
                  </div>
                  <p className="panel-sub">
                    {group.amount} per {group.cycle.toLowerCase()}, protected by collateral and trust scoring.
                  </p>
                  <button type="button" className="btn-join detail-contribute" onClick={toggleJoin}>
                    <Icon name="check" size={15} />
                    Join this circle
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="panel payout-panel">
            <div className="panel-head">
              <h3>Priority rotation</h3>
            </div>
            <div className="panel-body">
              <div className="payout-list">
                {(priorityPreview.length ? priorityPreview : group.upcoming).map((u) => (
                  <div className="payout-item" key={`${u.pos}-${u.who}`}>
                    <span className="payout-pos">{u.pos}</span>
                    <strong>{u.who}</strong>
                    <em>{u.when}</em>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel transparency-panel" style={{ marginTop: '1.25rem' }}>
        <div className="panel-head">
          <h3>This cycle&apos;s payments</h3>
          <span className="streak-chip">
            <Icon name="check" size={12} />
            {group.filled}/{group.members} paid
          </span>
        </div>
        <div className="panel-body">
          <p className="panel-sub">Everyone can see exactly who has paid. No hidden balances.</p>
          <div className="progress-bar">
            <div style={{ width: `${cyclePct}%` }} />
          </div>
          <div className="roster" role="list">
            {group.roster.map((m) => (
              <div className={`roster-item ${m.paid ? 'paid' : ''}`} key={m.name}>
                <span className="roster-avatar">{m.name[0]}</span>
                <span className="roster-name">{m.name}</span>
                {m.paid ? (
                  <span className="pay-chip paid">
                    <Icon name="check" size={12} />
                    Paid
                  </span>
                ) : (
                  <span className="pay-chip missed">
                    <Icon name="x" size={12} />
                    Not yet
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel history-panel">
        <div className="panel-head">
          <h3>Payment history</h3>
          <span className="streak-chip">
            <Icon name="clock" size={12} />
            {group.history.length} transactions
          </span>
        </div>
        <div className="panel-body">
          <div className="history-list">
            {group.history.map((h, i) => (
              <div className="history-item" key={i}>
                <span className="history-ic">
                  <Icon name={h.kind === 'out' ? 'wallet' : 'check'} size={17} />
                </span>
                <div className="history-mid">
                  <strong>{h.desc}</strong>
                  <span>
                    {h.date} · {group.cycle.toLowerCase()}
                  </span>
                </div>
                <span className="history-amount">+GH₵ {h.amount}</span>
                <span className="pay-chip paid">
                  <Icon name="check" size={12} />
                  Paid
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AIOffer
        title="Understand this circle better"
        text="Ask your AI coach to explain the payout rotation, estimate your full cycle, or flag a group that's falling behind."
        points={['Rotation explained', 'Cycle estimate', 'Health check']}
      />

      <ContributePaymentModal
        open={payOpen}
        circleName={group.name}
        defaultAmount={group.weekly}
        onClose={() => setPayOpen(false)}
        onSuccess={(amount) => setContributed((current) => current + amount)}
      />

      <StandingOrderModal
        open={mandateOpen}
        onClose={() => setMandateOpen(false)}
        circleId={group.id}
        circleName={group.name}
        weekly={group.weekly}
        onSave={enableMandate}
      />
    </PageShell>
  )
}

export default SavingsDetail
