import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/icons'
import AIOffer from '../components/AIOffer'
import ContributePaymentModal from '../components/savings/ContributePaymentModal'
import { PageShell } from '../components/ui/PageShell'
import { GROUPS, fmt, getJoined, setJoined } from '../data/savings'
import './Feature.css'

function SavingsDetail() {
  const { id } = useParams()
  const group = GROUPS.find((g) => g.id === id)
  const [joined, setJoinedState] = useState(getJoined().includes(id))
  const [contributed, setContributed] = useState(0)
  const [payOpen, setPayOpen] = useState(false)

  if (!group) {
    return (
      <PageShell>
          <Link to="/savings" className="detail-back">
            <Icon name="chevron" size={16} />
            Back to savings
          </Link>
          <div className="empty-state featured-empty">
            <p>We couldn't find that savings circle.</p>
            <Link to="/savings" className="btn-primary-dark">
              Browse circles
            </Link>
          </div>
      </PageShell>
    )
  }

  const toggleJoin = () => {
    const current = getJoined()
    const next = joined ? current.filter((x) => x !== id) : [...current, id]
    setJoined(next)
    setJoinedState(!joined)
  }

  const cyclePct = Math.round((group.filled / group.members) * 100)
  const totalSaved = (group.youSaved || 0) + contributed

  const stats = [
    { icon: 'wallet', label: 'Contribution', value: group.amount.split(' /')[0], cap: `${group.cycle} per slot`, hue: 'pink' },
    { icon: 'clock', label: 'Next payout', value: group.nextPayout, cap: `${group.filled} payments in`, hue: 'yellow' },
    { icon: 'users', label: 'Members', value: String(group.members), cap: `${group.members - group.filled} still to pay`, hue: 'blue' },
    { icon: 'target', label: 'Your position', value: group.payoutPosition, cap: `out of ${group.members} slots`, hue: 'green' },
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
          <div className="panel transparency-panel">
            <div className="panel-head">
              <h3>This cycle's payments</h3>
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
                        <span>Next deduction</span>
                        <b>Mon, 14 Sep</b>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-join detail-contribute"
                      onClick={() => setPayOpen(true)}
                    >
                      <Icon name="wallet" size={15} />
                      Contribute GH₵ {group.weekly}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="contribution-amount">
                      <strong>Join to contribute</strong>
                      <span>and track your savings</span>
                    </div>
                    <p className="panel-sub">
                      {group.amount} per {group.cycle.toLowerCase()}, with every payment visible to members.
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
                <h3>Payout rotation</h3>
              </div>
              <div className="panel-body">
                <div className="payout-list">
                  {group.upcoming.map((u, i) => (
                    <div className={`payout-item ${i === 2 ? 'you' : ''}`} key={u.who}>
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
      </PageShell>
  )
}

export default SavingsDetail