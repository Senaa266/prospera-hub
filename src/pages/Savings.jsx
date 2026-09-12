import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/icons'
import AIOffer from '../components/AIOffer'
import ContributePaymentModal from '../components/savings/ContributePaymentModal'
import { AppButton } from '../components/ui/AppButton'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'
import { GROUPS, PERSONAL_GOALS, fmt, getJoined, setJoined } from '../data/savings'
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

function Savings() {
  const [tab, setTab] = useState('mine')
  const [joined, setJoinedState] = useState(getJoined())
  const [goals, setGoals] = useState(PERSONAL_GOALS)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState({ name: '', target: '', weekly: '' })
  const [payCircle, setPayCircle] = useState(null)
  const [extras, setExtras] = useState({})
  const [editGoal, setEditGoal] = useState(null)

  const myGroups = GROUPS.filter((g) => joined.includes(g.id))

  const toggleJoin = (id) => {
    const next = joined.includes(id) ? joined.filter((x) => x !== id) : [...joined, id]
    setJoinedState(next)
    setJoined(next)
  }

  const topUp = (id) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, saved: Math.min(g.saved + g.weekly, g.target) } : g))
    )
  }

  const createGoal = (e) => {
    e.preventDefault()
    const target = Number(draft.target)
    const weekly = Number(draft.weekly)
    if (!draft.name || !target || !weekly) return
    const goal = {
      id: `goal-${Date.now()}`,
      name: draft.name,
      tag: 'Personal goal',
      saved: 0,
      target,
      weekly,
      next: 'This week',
    }
    setGoals((prev) => [...prev, goal])
    setDraft({ name: '', target: '', weekly: '' })
    setShowForm(false)
  }

  const personalTotal = goals.reduce((sum, g) => sum + g.saved, 0)
  const groupTotal = myGroups.reduce((sum, g) => sum + (g.youSaved || 0) + (extras[g.id] || 0), 0)

  const stats = [
    { icon: 'wallet', label: 'Total saved', value: fmt(groupTotal + personalTotal), cap: '+GH₵ 480 this month', hue: 'pink' },
    { icon: 'users', label: 'Active circles', value: String(myGroups.length), cap: 'Groups + personal combined', hue: 'blue' },
    { icon: 'target', label: 'Personal goals', value: String(goals.length), cap: 'All on track', hue: 'green' },
    { icon: 'trend', label: 'On-time streak', value: myGroups.length > 0 ? '4 weeks' : '—', cap: 'Longest run yet', hue: 'yellow' },
  ]

  return (
    <PageShell>
      <PageHeader
        title="Susu"
        accent="Savings"
        subtitle="Group circles with full transparency, plus personal goals you control."
      />

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

        <div className="sav-tabs" role="tablist">
          <button type="button" className={`sav-tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
            <Icon name="users" size={15} />
            My circles
            <span className="sav-tab-count">{myGroups.length}</span>
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
          </button>
        </div>

        {tab === 'mine' && (
          <div className="groups-list">
            {myGroups.length === 0 ? (
              <div className="empty-state">
                <p>You are not in any savings circle yet.</p>
                <p className="empty-sub">Join a group to start saving with people you trust.</p>
                <button type="button" className="btn-primary-dark" onClick={() => setTab('discover')}>
                  Find a circle
                </button>
              </div>
            ) : (
              myGroups.map((g) => (
                <div className="group-card" key={g.id}>
                  <div className="gc-info">
                    <div className="gc-head">
                      <div className="gc-name">
                        <h3>{g.name}</h3>
                      </div>
                      <div className="gc-chips">
                        <span className={`vis-chip ${g.visibility === 'Private' ? 'priv' : 'pub'}`}>
                          <Icon name={g.visibility === 'Private' ? 'shield' : 'external'} size={12} />
                          {g.visibility}
                        </span>
                        <span className="member-chip">
                          <Icon name="users" size={13} />
                          {g.members} members
                        </span>
                      </div>
                    </div>

                    <p className="gc-amount">{g.amount}</p>
                    <div className="gc-meta">
                      <span>
                        <Icon name="users" size={14} />
                        <strong>{g.filled}/{g.members}</strong> spots filled
                      </span>
                      <span>
                        <Icon name="clock" size={14} />
                        Next payout {g.nextPayout}
                      </span>
                    </div>

                    <div className="progress-bar">
                      <div style={{ width: `${(g.filled / g.members) * 100}%` }} />
                    </div>

                    <div className="gc-saved-row">
                      <span>
                        <Icon name="wallet" size={14} />
                        You've saved <strong>{fmt((g.youSaved || 0) + (extras[g.id] || 0))}</strong>
                      </span>
                      <span className={`life-pill ${g.streak !== '—' ? 'on' : 'off'}`}>
                        <Icon name={g.streak !== '—' ? 'check' : 'x'} size={12} />
                        {g.streak !== '—' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="gc-foot">
                    <span className="gc-note">
                      <Icon name="clock" size={14} />
                      Payout {g.nextPayout} · {g.cycle}
                    </span>
                    <div className="gc-btns">
                      <button type="button" className="btn-join" onClick={() => setPayCircle(g)}>
                        Contribute
                      </button>
                      <Link to={`/savings/${g.id}`} className="btn-outline-dark">
                        View group
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'personal' && (
          <>
            <div className="personal-head">
              <p>Set a target and automate a weekly amount. Perfect for goals a circle isn't built for.</p>
              <button type="button" className="btn-primary-dark" onClick={() => setShowForm((v) => !v)}>
                <span className="btn-icon">
                  <Icon name="plus" size={15} />
                </span>
                New saving goal
              </button>
            </div>

            {showForm && (
              <form className="goal-form" onSubmit={createGoal}>
                <input
                  type="text"
                  placeholder="Goal name (e.g. New equipment fund)"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Target (GH₵)"
                  min="1"
                  value={draft.target}
                  onChange={(e) => setDraft({ ...draft, target: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Save per week (GH₵)"
                  min="1"
                  value={draft.weekly}
                  onChange={(e) => setDraft({ ...draft, weekly: e.target.value })}
                  required
                />
                <div className="goal-form-actions">
                  <button type="submit" className="btn-primary-dark">
                    Create goal
                  </button>
                  <button type="button" className="btn-outline-dark" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="goals-list">
              {goals.map((g) => {
                const pct = Math.min(Math.round((g.saved / g.target) * 100), 100)
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
                            <span className="transparency-chip">{g.tag}</span>
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
                          Next deduction {g.next}
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
                        <button type="button" className="btn-join" onClick={() => topUp(g.id)}>
                          Top up
                        </button>
                        <button type="button" className="btn-outline-dark" onClick={() => setEditGoal({ ...g })}>
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {goals.length === 0 && (
                <div className="empty-state">
                  <p>No personal goals yet.</p>
                  <p className="empty-sub">Create one — even GH₵ 50 a week adds up.</p>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'discover' && (
          <div className="groups-list">
            {GROUPS.map((g) => {
              const isJoined = joined.includes(g.id)
              const spots = g.members - g.filled
              return (
                <div className="group-card discover" key={g.id}>
                  <div className="gc-info">
                    <div className="gc-head">
                      <div className="gc-name">
                        <h3>{g.name}</h3>
                      </div>
                      <div className="gc-chips">
                        <span className={`vis-chip ${g.visibility === 'Private' ? 'priv' : 'pub'}`}>
                          <Icon name={g.visibility === 'Private' ? 'shield' : 'external'} size={12} />
                          {g.visibility}
                        </span>
                        <span className="member-chip">
                          <Icon name="users" size={13} />
                          {g.members} members
                        </span>
                      </div>
                    </div>

                    <p className="gc-amount">{g.amount}</p>
                    <div className="gc-meta">
                      <span>
                        <Icon name="users" size={14} />
                        <strong>{spots}</strong> spots left
                      </span>
                      <span>
                        <Icon name="clock" size={14} />
                        Next payout {g.nextPayout} · {g.cycle}
                      </span>
                    </div>

                    <div className="progress-bar">
                      <div style={{ width: `${(g.filled / g.members) * 100}%` }} />
                    </div>

                    <div className="gc-saved-row">
                      <span>
                        <Icon name={g.visibility === 'Public' ? 'shield' : 'check'} size={13} />
                        {g.visibility === 'Public' ? 'Every payment is public' : 'Members only'}
                      </span>
                      {g.visibility === 'Public' || isJoined ? (
                        <span className={`life-pill ${g.streak !== '—' ? 'on' : 'off'}`}>
                          <Icon name={g.streak !== '—' ? 'check' : 'x'} size={12} />
                          {g.streak !== '—' ? 'Active' : 'Inactive'}
                        </span>
                      ) : (
                        <span className="streak-chip">
                          <Icon name="shield" size={12} />
                          By invite
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="gc-foot">
                    <span className="gc-note">
                      <Icon name="users" size={14} />
                      {g.members - g.filled} open spots
                    </span>
                    <div className="gc-btns">
                      <button
                        type="button"
                        className={`btn-join ${isJoined ? 'joined' : ''}`}
                        onClick={() => toggleJoin(g.id)}
                      >
                        {isJoined ? (
                          <>
                            <Icon name="check" size={15} />
                            Joined
                          </>
                        ) : (
                          'Join circle'
                        )}
                      </button>
                      <Link to={`/savings/${g.id}`} className="btn-outline-dark">
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
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
          open={Boolean(payCircle)}
          circleName={payCircle?.name || 'this circle'}
          defaultAmount={payCircle?.weekly || 200}
          onClose={() => setPayCircle(null)}
          onSuccess={(amount) => {
            if (!payCircle) return
            setExtras((current) => ({
              ...current,
              [payCircle.id]: (current[payCircle.id] || 0) + amount,
            }))
          }}
        />

        <Modal
          open={Boolean(editGoal)}
          title={editGoal ? `Edit ${editGoal.name}` : 'Edit goal'}
          onClose={() => setEditGoal(null)}
        >
          {editGoal ? (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                const target = Number(editGoal.target)
                const weekly = Number(editGoal.weekly)
                if (!editGoal.name || !target || !weekly) return
                setGoals((current) =>
                  current.map((goal) =>
                    goal.id === editGoal.id
                      ? { ...goal, name: editGoal.name, target, weekly, tag: editGoal.tag || goal.tag }
                      : goal,
                  ),
                )
                setEditGoal(null)
              }}
            >
              <label className="grid gap-1.5 text-sm font-semibold">
                Goal name
                <input
                  value={editGoal.name}
                  onChange={(e) => setEditGoal({ ...editGoal, name: e.target.value })}
                  className="rounded-xl border border-line px-3 py-2.5"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Target (GH₵)
                <input
                  type="number"
                  min="1"
                  value={editGoal.target}
                  onChange={(e) => setEditGoal({ ...editGoal, target: e.target.value })}
                  className="rounded-xl border border-line px-3 py-2.5"
                  required
                />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                Save per week (GH₵)
                <input
                  type="number"
                  min="1"
                  value={editGoal.weekly}
                  onChange={(e) => setEditGoal({ ...editGoal, weekly: e.target.value })}
                  className="rounded-xl border border-line px-3 py-2.5"
                  required
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <AppButton type="submit">Save changes</AppButton>
                <AppButton variant="outline" onClick={() => setEditGoal(null)}>
                  Cancel
                </AppButton>
              </div>
            </form>
          ) : null}
        </Modal>
      </PageShell>
  )
}

export default Savings