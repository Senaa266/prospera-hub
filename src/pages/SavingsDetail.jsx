import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/icons'
import AIOffer from '../components/AIOffer'
import CircleHealthPanel from '../components/savings/CircleHealthPanel'
import ContributePaymentModal from '../components/savings/ContributePaymentModal'
import StandingOrderModal from '../components/savings/StandingOrderModal'
import { CircleProtectionPanel } from '../components/savings/SusuSecurityPanel'
import { AppButton } from '../components/ui/AppButton'
import { PageShell } from '../components/ui/PageShell'
import { savings } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useSusuSecurity } from '../context/SusuSecurityContext'
import { buildDemoSavingsDetail } from '../data/demoSavings'
import './Feature.css'

function fmt(n) {
  return `GH₵ ${Number(n || 0).toLocaleString()}`
}

function inviteIcon(kind) {
  switch (kind) {
    case 'payout':
      return { icon: 'bank', tone: '#bfe7d2', color: '#147a43' }
    case 'return':
      return { icon: 'percent', tone: '#faeab2', color: '#a98200' }
    case 'investment':
      return { icon: 'briefcase', tone: '#c0d7f9', color: '#2159c9' }
    case 'withdrawal':
      return { icon: 'arrowRight', tone: '#f5c4d8', color: '#c41468' }
    default:
      return { icon: 'check', tone: '#bfe7d2', color: '#147a43' }
  }
}

function InviteBox({ circle, token, onInvited }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const send = async (event) => {
    event?.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await savings.invite(circle.id, email.trim(), token)
      if (result.invite?.link) {
        try {
          await navigator.clipboard.writeText(result.invite.link)
          setCopied(result.invite.link)
        } catch {
          setCopied(result.invite.link)
        }
      }
      setEmail('')
      onInvited?.()
    } catch (err) {
      setError(err.message || 'Could not create the invite')
    } finally {
      setBusy(false)
    }
  }

  const copy = async (link) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(link)
      window.setTimeout(() => setCopied(''), 1800)
    } catch {
      setCopied('')
    }
  }

  return (
    <div className="mt-4 border-t border-ink/10 pt-4">
      <form className="flex flex-wrap gap-2" onSubmit={send}>
        <input
          type="email"
          placeholder="Email to invite"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink focus:border-ink-strong"
        />
        <AppButton type="submit" variant="dark" disabled={busy}>
          <Icon name="mail" size={15} />
          {busy ? 'Sending…' : 'Send invite'}
        </AppButton>
      </form>
      {error ? <p className="m-0 mt-2 text-sm font-semibold text-red-600">{error}</p> : null}

      {circle.invites?.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {circle.invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2">
              <Icon name="mail" size={14} className="shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{inv.email || 'Invite link'}</span>
              <span className="shrink-0 text-xs font-bold text-muted">
                {inv.status === 'pending' ? 'Pending' : 'Accepted'}
              </span>
              <button
                type="button"
                onClick={() => void copy(inv.link)}
                className="shrink-0 text-xs font-bold text-ink-strong underline underline-offset-2 hover:text-prospera"
              >
                {copied === inv.link ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SavingsDetail() {
  const { id } = useParams()
  const { token, user } = useAuth()
  const { restrictions, enableMandate, getCircle, ensureCircle } = useSusuSecurity()
  const [circle, setCircle] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [joinError, setJoinError] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [mandateOpen, setMandateOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await savings.detail(id, token || 'demo-token')
      setCircle(result.circle)
      setLoadError('')
    } catch (err) {
      const demo = buildDemoSavingsDetail(id)
      setCircle(demo.circle)
      setLoadError(
        `${err.message || 'Could not load this circle'}. Showing a demo circle so the page stays usable.`,
      )
    }
  }, [id, token])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (circle) ensureCircle(circle)
  }, [circle, ensureCircle])

  const joinCircle = async () => {
    setJoinError('')
    if (!restrictions.canJoinSavingsCircle) {
      setJoinError(restrictions.message)
      return
    }
    try {
      await savings.join(id, token)
      await load()
    } catch (err) {
      setJoinError(err.message || 'Could not join this circle')
    }
  }

  if (loadError && !circle) {
    return (
      <PageShell>
        <Link to="/savings" className="detail-back">
          <Icon name="chevron" size={16} />
          Back to savings
        </Link>
        <div className="empty-state featured-empty">
          <p>{loadError}</p>
          <Link to="/savings" className="btn-primary-dark">
            Browse circles
          </Link>
        </div>
      </PageShell>
    )
  }

  if (!circle) {
    return (
      <PageShell>
        <Link to="/savings" className="detail-back">
          <Icon name="chevron" size={16} />
          Back to savings
        </Link>
        <div className="empty-state featured-empty">
          <p>Loading circle details…</p>
        </div>
      </PageShell>
    )
  }

  const paidTotal = circle.filled || 0
  const cyclePct = Math.min(100, Math.round((paidTotal / Math.max(circle.members, 1)) * 100))
  const isMember = Boolean(circle.joined)
  const plan = circle.plan || {}
  const protection = getCircle(circle.id)

  const stats = [
    {
      icon: 'wallet',
      label: 'Contribution',
      value: fmt(circle.weekly),
      cap: `${circle.displayCycle} per slot`,
      hue: 'pink',
    },
    {
      icon: 'clock',
      label: 'Next payout',
      value: circle.nextPayout,
      cap: `${plan.pot ? fmt(plan.pot) : circle.balance} in the pot`,
      hue: 'yellow',
    },
    {
      icon: 'users',
      label: 'Members',
      value: String(circle.members),
      cap: `${circle.members - paidTotal} still to pay`,
      hue: 'blue',
    },
    {
      icon: 'shield',
      label: 'Security pool',
      value: protection ? fmt(protection.sharedSecurityPool) : fmt(circle.pot || 0),
      cap: protection?.surchargePerMember
        ? `+${fmt(protection.surchargePerMember)} surcharge`
        : isMember
          ? `out of ${circle.members} slots`
          : 'Zero-loss cover',
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
            <h1>{circle.name}</h1>
            <span className={`status-chip ${isMember ? '' : 'join'}`}>
              <span className="status-dot" />
              {isMember ? (circle.role === 'creator' ? 'You created this' : 'Member') : 'Not joined'}
            </span>
          </div>
          <p className="feature-sub">{circle.description}</p>
        </div>
        <span className="pot-chip">
          <Icon name="wallet" size={15} />
          {fmt(circle.pot)}
        </span>
      </div>

      {joinError ? (
        <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800" role="alert">
          {joinError}
        </p>
      ) : null}
      {loadError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {loadError}
        </div>
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
        <div className="panel transparency-panel">
          <div className="panel-head">
            <h3>This cycle&apos;s payments</h3>
            <span className="streak-chip">
              <Icon name="check" size={12} />
              {paidTotal}/{circle.members} paid
            </span>
          </div>
          <div className="panel-body">
            <p className="panel-sub">Everyone can see exactly who has paid. No hidden balances.</p>
            <div className="progress-bar">
              <div style={{ width: `${cyclePct}%` }} />
            </div>
            <div className="roster" role="list">
              {(circle.roster || []).map((m) => (
                <div className={`roster-item ${m.paid ? 'paid' : ''}`} key={m.id || m.name}>
                  <span className="roster-avatar">{m.name[0]}</span>
                  <span className="roster-name">
                    {m.name}
                    {m.isYou ? <em className="not-italic text-muted"> · you</em> : null}
                    {m.role === 'creator' ? <em className="not-italic text-muted"> · creator</em> : null}
                  </span>
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
            {isMember ? <InviteBox circle={circle} token={token} onInvited={load} /> : null}
          </div>
        </div>

        <div className="detail-side">
          <div className="panel contribution-panel">
            <div className="panel-head">
              <h3>My contribution</h3>
            </div>
            <div className="panel-body">
              {isMember ? (
                <>
                  <div className="contribution-amount">
                    <strong>{fmt(circle.youSaved || 0)}</strong>
                    <span>saved in this circle</span>
                  </div>
                  <div className="contribution-rows">
                    <div className="contribution-row">
                      <span>On-time streak</span>
                      <b>
                        <Icon name="check" size={13} />
                        {circle.streak}
                      </b>
                    </div>
                    <div className="contribution-row">
                      <span>Next payout</span>
                      <b>{plan.nextRecipient || 'Standing order'}</b>
                    </div>
                  </div>
                  <button type="button" className="btn-join detail-contribute" onClick={() => setPayOpen(true)}>
                    <Icon name="wallet" size={15} />
                    Contribute {fmt(circle.weekly)}
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
                    {circle.amount} per {String(circle.displayCycle || 'week').toLowerCase()}, protected by collateral
                    and trust scoring.
                  </p>
                  <button type="button" className="btn-join detail-contribute" onClick={() => void joinCircle()}>
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
                {(circle.upcoming || []).map((u, i) => (
                  <div className={`payout-item ${u.isYou ? 'you' : ''}`} key={`${u.pos}-${i}`}>
                    <span className="payout-pos">{u.pos}</span>
                    <strong>{u.who}</strong>
                    <em>{u.when}</em>
                  </div>
                ))}
              </div>
              {plan.nextRecipient ? (
                <p className="m-0 mt-3 flex items-start gap-2 text-sm leading-6 text-muted">
                  <Icon name="info" size={15} className="mt-0.5 shrink-0" />
                  Next payout is {fmt(plan.nextAmount)} to {plan.nextRecipient}. Members who fall behind move to the
                  back of the queue.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <CircleProtectionPanel circleId={circle.id} weekly={circle.weekly} />
      </div>

      <div className="panel history-panel" style={{ marginTop: '1.25rem' }}>
        <div className="panel-head" style={{ background: '#c0d7f9' }}>
          <h3>
            <span className="inline-flex items-center gap-2">
              <Icon name="bank" size={16} />
              Fairness check
            </span>
          </h3>
          <span className="streak-chip">
            <Icon name="shield" size={12} />
            Transparent
          </span>
        </div>
        <div className="panel-body">
          <CircleHealthPanel circle={circle} token={token} onPaid={() => void load()} />
        </div>
      </div>

      <div className="panel history-panel">
        <div className="panel-head" style={{ background: '#dcf3e6' }}>
          <h3>Payment history</h3>
          <span className="streak-chip">
            <Icon name="clock" size={12} />
            {(circle.history || []).length} transactions
          </span>
        </div>
        <div className="panel-body">
          {(circle.history || []).length === 0 ? (
            <p className="m-0 py-3 text-center text-sm text-muted">No payments recorded yet.</p>
          ) : (
            <div className="history-list">
              {(circle.history || []).map((h) => {
                const kindStyle = inviteIcon(h.kind)
                const isCredit = h.kind === 'payout' || h.kind === 'return'
                return (
                  <div className="history-item" key={h.id || `${h.kind}-${h.date}-${h.amount}`}>
                    <span className="history-ic" style={{ background: kindStyle.tone, color: kindStyle.color }}>
                      <Icon name={kindStyle.icon} size={17} />
                    </span>
                    <div className="history-mid">
                      <strong>{h.desc}</strong>
                      <span>
                        {h.actor} · {h.date} · {h.method}
                      </span>
                    </div>
                    <span className={`history-amount ${isCredit ? '' : 'debit'}`}>
                      {isCredit ? '+' : '−'}
                      {fmt(h.amount)}
                    </span>
                    <span className={`pay-chip ${h.kind === 'withdrawal' ? 'missed' : 'paid'}`}>
                      <Icon name="check" size={12} />
                      {h.kind}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <AIOffer
        title="Understand this circle better"
        text="Ask your AI coach to explain the payout rotation, estimate your full cycle, or flag a group that's falling behind."
        points={['Rotation explained', 'Cycle estimate', 'Health check']}
      />

      <ContributePaymentModal
        open={payOpen}
        circle={circle}
        token={token}
        email={user?.email}
        defaultAmount={circle.weekly}
        onClose={() => setPayOpen(false)}
        onSuccess={() => {
          void load()
        }}
      />

      <StandingOrderModal
        open={mandateOpen}
        onClose={() => setMandateOpen(false)}
        circleId={circle.id}
        circleName={circle.name}
        weekly={circle.weekly}
        onSave={enableMandate}
      />
    </PageShell>
  )
}

export default SavingsDetail
