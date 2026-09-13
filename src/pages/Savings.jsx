import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/icons'
import AIOffer from '../components/AIOffer'
import ContributePaymentModal from '../components/savings/ContributePaymentModal'
import CreateCircleModal from '../components/savings/CreateCircleModal'
import InvestmentPanel from '../components/savings/InvestmentPanel'
import StandingOrderModal from '../components/savings/StandingOrderModal'
import { SusuSecurityOverview } from '../components/savings/SusuSecurityPanel'
import { AppButton } from '../components/ui/AppButton'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'
import { savings } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useSusuSecurity } from '../context/SusuSecurityContext'
import { buildDemoSavingsOverview } from '../data/demoSavings'
import './Feature.css'

const STEPS = [
  {
    n: '1',
    title: 'Join a circle',
    text: 'Pick a group you trust and a weekly amount you can afford.',
  },
  {
    n: '2',
    title: 'Contribute weekly',
    text: 'Every payment is visible to all members. No hidden balances.',
  },
  {
    n: '3',
    title: 'Get your payout',
    text: 'Lump sums are paid out on a fixed rotation, split fairly.',
  },
]

function fmt(n) {
  return `GH₵ ${Number(n || 0).toLocaleString()}`
}

function CircleCard({ circle, joinCircle, onContribute, joinedView = false }) {
  const spots = circle.members - circle.filled
  return (
    <div className={`group-card ${joinedView ? '' : 'discover'}`}>
      <div className="gc-info">
        <div className="gc-head">
          <div className="gc-name">
            <h3>{circle.name}</h3>
          </div>
          <div className="gc-chips">
            <span className={`vis-chip ${circle.visibility === 'Private' ? 'priv' : 'pub'}`}>
              <Icon name={circle.visibility === 'Private' ? 'lock' : 'external'} size={12} />
              {circle.visibility}
            </span>
            <span className="member-chip">
              <Icon name="users" size={13} />
              {circle.members} members
            </span>
          </div>
        </div>

        <p className="gc-amount">{circle.amount}</p>
        <div className="gc-meta">
          <span>
            <Icon name="users" size={14} />
            <strong>{joinedView ? `${circle.filled} paid` : `${spots} spots left`}</strong>
          </span>
          <span>
            <Icon name="clock" size={14} />
            Next payout {circle.nextPayout}
          </span>
        </div>

        <div className="progress-bar">
          <div style={{ width: `${Math.min(100, (circle.filled / Math.max(circle.members, 1)) * 100)}%` }} />
        </div>

        <div className="gc-saved-row">
          <span>
            <Icon name="wallet" size={14} />
            {joinedView ? (
              <>
                You&apos;ve saved <strong>{fmt(circle.youSaved || 0)}</strong>
              </>
            ) : circle.visibility === 'Public' ? (
              'Every payment is public'
            ) : (
              'Members only'
            )}
          </span>
          <span className={`life-pill ${circle.streak && circle.streak !== '—' ? 'on' : 'off'}`}>
            <Icon name={circle.streak && circle.streak !== '—' ? 'check' : 'x'} size={12} />
            {circle.streak && circle.streak !== '—' ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="gc-foot">
        <span className="gc-note">
          <Icon name="clock" size={14} />
          Payout {circle.nextPayout} · {circle.displayCycle}
        </span>
        <div className="gc-btns">
          {joinedView ? (
            <button type="button" className="btn-join" onClick={() => onContribute(circle)}>
              Contribute
            </button>
          ) : (
            <button
              type="button"
              className="btn-join"
              onClick={() => circle.visibility !== 'Private' && joinCircle(circle.id)}
            >
              Join circle
            </button>
          )}
          <Link to={`/savings/${circle.id}`} className="btn-outline-dark">
            {joinedView ? 'View group' : 'Details'}
          </Link>
        </div>
      </div>
    </div>
  )
}

function Savings() {
  const { token, user } = useAuth()
  const { restrictions, enableMandate } = useSusuSecurity()
  const [tab, setTab] = useState('mine')
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [payTarget, setPayTarget] = useState(null)
  const [goalDraft, setGoalDraft] = useState({ name: '', target: '', weekly: '' })
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [mandateOpen, setMandateOpen] = useState(false)

  const load = useCallback(async () => {
    if (!token) {
      setData(buildDemoSavingsOverview())
      setLoadError('Signed out — showing demo susu circles. Sign in to sync with the server.')
      return
    }
    try {
      const fresh = await savings.list(token)
      setData(fresh)
      setLoadError('')
    } catch (err) {
      setData(buildDemoSavingsOverview())
      setLoadError(
        `${err.message || 'Could not reach the savings API'}. Showing demo susu circles so you can keep exploring.`,
      )
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const joinCircle = async (id) => {
    if (!restrictions.canJoinSavingsCircle) {
      setLoadError(restrictions.message)
      setTab('mine')
      return
    }
    setBusy(true)
    try {
      await savings.join(id, token)
      await load()
    } catch (err) {
      setLoadError(err.message || 'Could not join this circle')
    } finally {
      setBusy(false)
    }
  }

  const createGoal = async (event) => {
    event.preventDefault()
    const target = Number(goalDraft.target)
    if (!goalDraft.name || !target) return
    setBusy(true)
    try {
      await savings.createGoal(
        { name: goalDraft.name, target, weekly: Number(goalDraft.weekly) || 0 },
        token,
      )
      setGoalDraft({ name: '', target: '', weekly: '' })
      setShowGoalForm(false)
      await load()
    } catch (err) {
      setLoadError(err.message || 'Could not create the goal')
    } finally {
      setBusy(false)
    }
  }

  if (!data) {
    return (
      <PageShell>
        <PageHeader title="Susu" accent="Savings" subtitle="Loading your savings…" />
        <div className="empty-state">
          <p>{loadError || 'Calculating your balance…'}</p>
        </div>
      </PageShell>
    )
  }

  const account = data.account || {}
  const myCircles = data.circles.filter((c) => c.joined)
  const discover = data.circles.filter((c) => !c.joined)
  const goals = data.goals || []
  const personalTotal = goals.reduce((sum, g) => sum + Number(g.saved || 0), 0)
  const contributions = myCircles.reduce((sum, c) => sum + Number(c.youSaved || 0), 0)
  const mandateCircle = myCircles[0] || data.circles[0]

  const stats = [
    { icon: 'wallet', label: 'Total saved', value: fmt(account.total), cap: 'All circles + personal', hue: 'pink' },
    { icon: 'target', label: 'Personal goals', value: String(goals.length), cap: `${fmt(personalTotal)} saved`, hue: 'green' },
    { icon: 'users', label: 'Active circles', value: String(myCircles.length), cap: `${fmt(contributions)} contributed`, hue: 'blue' },
    {
      icon: 'shield',
      label: 'Protection',
      value: restrictions.canJoinSavingsCircle ? 'Clear' : 'Restricted',
      cap: account.invested > 0 ? `${fmt(account.invested)} invested` : 'Hit-and-run engine',
      hue: 'yellow',
    },
  ]

  return (
    <PageShell>
      <PageHeader
        title="Susu"
        accent="Savings"
        subtitle="Group circles with zero-loss default protection, standing orders, and transparent payouts."
        actions={
          <AppButton variant="dark" onClick={() => setShowCreate(true)}>
            <Icon name="plus" size={16} />
            Start a circle
          </AppButton>
        }
      />

      <SusuSecurityOverview onOpenMandate={() => setMandateOpen(true)} />

      {loadError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
          {loadError}
        </div>
      ) : null}

      <div className="sav-stats">
        {stats.map((s) => (
          <div className="sav-stat" key={s.label}>
            <div className="sav-stat-top">
              <span className={`sav-stat-icon c-${s.hue}`}>
                <Icon name={s.icon} size={21} />
              </span>
              <div>
                <span className="sav-stat-label">{s.label}</span>
                <strong>{s.value}</strong>
                <span className="sav-stat-cap">{s.cap}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-head" style={{ background: '#dbe9fd' }}>
          <h3>
            <span className="inline-flex items-center gap-2">
              <Icon name="briefcase" size={16} />
              Collaboration investments
            </span>
          </h3>
          {account.unlocked ? (
            <span className="streak-chip">
              <Icon name="check" size={12} />
              Unlocked
            </span>
          ) : null}
        </div>
        <div className="panel-body">
          <InvestmentPanel
            account={account}
            vault={data.vault || []}
            investments={data.investments || []}
            token={token}
            onChanged={load}
          />
        </div>
      </div>

      <div className="sav-tabs" role="tablist">
        <button type="button" className={`sav-tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
          <Icon name="users" size={15} />
          My circles
          <span className="sav-tab-count">{myCircles.length}</span>
        </button>
        <button
          type="button"
          className={`sav-tab ${tab === 'personal' ? 'active' : ''}`}
          onClick={() => setTab('personal')}
        >
          <Icon name="target" size={15} />
          Personal savings
          <span className="sav-tab-count">{goals.length}</span>
        </button>
        <button
          type="button"
          className={`sav-tab ${tab === 'discover' ? 'active' : ''}`}
          onClick={() => setTab('discover')}
        >
          <Icon name="rocket" size={15} />
          Discover circles
          <span className="sav-tab-count">{discover.length}</span>
        </button>
      </div>

      {tab === 'mine' && (
        <div className="groups-list">
          {myCircles.length === 0 ? (
            <div className="empty-state">
              <p>You are not in any savings circle yet.</p>
              <p className="empty-sub">Join a group to start saving with people you trust.</p>
              <button type="button" className="btn-primary-dark" onClick={() => setTab('discover')}>
                Find a circle
              </button>
            </div>
          ) : (
            myCircles.map((c) => (
              <CircleCard
                key={c.id}
                circle={c}
                joinedView
                onContribute={(circle) => setPayTarget({ circle })}
              />
            ))
          )}
        </div>
      )}

      {tab === 'personal' && (
        <>
          <div className="personal-head">
            <p>Set a target and automate a weekly amount. Perfect for goals a circle isn&apos;t built for.</p>
            <button type="button" className="btn-primary-dark" onClick={() => setShowGoalForm((v) => !v)}>
              <span className="btn-icon">
                <Icon name="plus" size={15} />
              </span>
              New saving goal
            </button>
          </div>

          {showGoalForm ? (
            <form className="goal-form" onSubmit={createGoal}>
              <input
                type="text"
                placeholder="Goal name (e.g. New equipment fund)"
                value={goalDraft.name}
                onChange={(e) => setGoalDraft({ ...goalDraft, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Target (GH₵)"
                min="1"
                value={goalDraft.target}
                onChange={(e) => setGoalDraft({ ...goalDraft, target: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Save per week (GH₵)"
                min="1"
                value={goalDraft.weekly}
                onChange={(e) => setGoalDraft({ ...goalDraft, weekly: e.target.value })}
                required
              />
              <div className="goal-form-actions">
                <button type="submit" className="btn-primary-dark" disabled={busy}>
                  {busy ? 'Saving…' : 'Create goal'}
                </button>
                <button type="button" className="btn-outline-dark" onClick={() => setShowGoalForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="goals-list">
            {goals.map((g) => {
              const pct = Math.min(Math.round((Number(g.saved || 0) / Math.max(Number(g.target) || 1, 1)) * 100), 100)
              return (
                <div className="goal-card" key={g.id}>
                  <div className="gc-info">
                    <div className="gc-head">
                      <div className="gc-name">
                        <span className="goal-icon">
                          <Icon name="target" size={18} />
                        </span>
                        <div>
                          <h3>{g.name}</h3>
                          <span className="transparency-chip">{g.tag || 'Personal goal'}</span>
                        </div>
                      </div>
                      <span className="member-chip">
                        <Icon name="sliders" size={12} />
                        auto {fmt(g.weekly)}/wk
                      </span>
                    </div>
                    <p className="gc-amount goal-amount">
                      {fmt(g.saved)} <span>of {fmt(g.target)}</span>
                    </p>
                    <div className="progress-bar">
                      <div style={{ width: `${pct}%` }} />
                    </div>
                    <div className="gc-saved-row">
                      <span>
                        <Icon name="clock" size={13} />
                        Next deduction {g.next || 'This week'}
                      </span>
                      <span className="goal-pct">{pct}% funded</span>
                    </div>
                  </div>
                  <div className="gc-foot">
                    <span className="gc-note">
                      <Icon name="sliders" size={13} />
                      Auto {fmt(g.weekly)} per week
                    </span>
                    <div className="gc-btns">
                      <button type="button" className="btn-join" onClick={() => setPayTarget({ goal: g })}>
                        Top up
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {goals.length === 0 ? (
              <div className="empty-state">
                <p>No personal goals yet.</p>
                <p className="empty-sub">Create one — even GH₵ 50 a week adds up.</p>
              </div>
            ) : null}
          </div>
        </>
      )}

      {tab === 'discover' && (
        <div className="groups-list">
          {discover.length === 0 ? (
            <div className="empty-state">
              <p>No open circles to discover.</p>
              <p className="empty-sub">Start your own circle and invite people you trust.</p>
              <button type="button" className="btn-primary-dark" onClick={() => setShowCreate(true)}>
                Start a circle
              </button>
            </div>
          ) : (
            discover.map((c) => (
              <CircleCard key={c.id} circle={c} joinCircle={joinCircle} onContribute={() => {}} />
            ))
          )}
        </div>
      )}

      <div className="how-it-works">
        <h2 className="section-title">How transparent savings work</h2>
        <div className="steps-row">
          {STEPS.map((s) => (
            <div className="how-step" key={s.n}>
              <div className="step-num">{s.n}</div>
              <h4>{s.title}</h4>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      <AIOffer
        title="Put your savings to work"
        text="Ask your AI coach to build a savings plan, estimate your next payout, or check how healthy a circle is."
        points={['Savings plan', 'Payout estimates', 'Circle health']}
      />

      <ContributePaymentModal
        open={Boolean(payTarget)}
        circle={payTarget?.circle}
        goal={payTarget?.goal}
        token={token}
        email={user?.email}
        defaultAmount={payTarget?.circle?.weekly || payTarget?.goal?.weekly || 200}
        onClose={() => setPayTarget(null)}
        onSuccess={() => {
          void load()
        }}
      />

      <CreateCircleModal
        open={showCreate}
        token={token}
        onClose={() => setShowCreate(false)}
        onCreate={() => {
          setShowCreate(false)
          setTab('mine')
          void load()
        }}
      />

      {mandateCircle ? (
        <StandingOrderModal
          open={mandateOpen}
          onClose={() => setMandateOpen(false)}
          circleId={mandateCircle.id}
          circleName={mandateCircle.name}
          weekly={mandateCircle.weekly}
          onSave={enableMandate}
        />
      ) : null}
    </PageShell>
  )
}

export default Savings
