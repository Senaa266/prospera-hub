import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useTrackers } from '../context/TrackersContext'
import { trackerProgress } from '../lib/trackerProgress'
import Icon from '../components/icons'
import GrantCarousel from '../components/GrantCarousel'
import { AppButton } from '../components/ui/AppButton'
import { AppCard } from '../components/ui/AppCard'
import { GrantSkeleton } from '../components/ui/Skeleton'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'
import { ProgressBar } from '../components/ui/ProgressBar'
import { loadGrants } from '../utils/grants'
import { DEMO_GRANTS } from '../data/grants'

const STATS = [
  { label: 'Total savings', value: 'GH₵ 2,450', icon: 'wallet', change: '+12% this week', from: 'from-prospera', to: 'to-prospera-dark' },
  { label: 'Grants matched', value: '3', icon: 'target', change: '2 new this month', from: 'from-rose-400', to: 'to-prospera' },
  { label: 'Business progress', value: '35%', icon: 'rocket', change: '5 steps left', from: 'from-prospera-dark', to: 'to-brand-violet' },
  { label: 'Revenue this month', value: 'GH₵ 1,250', icon: 'trend', change: '+18% vs last month', from: 'from-prospera', to: 'to-rose-300' },
]

const SUGGESTIONS = ['How do I start my bead business?', 'Which grants fit my business?', 'Explain susu savings']

function Dashboard() {
  const { user, logout } = useAuth()
  const { open } = useChat()
  const { trackers } = useTrackers()
  const navigate = useNavigate()
  const [featured, setFeatured] = useState(DEMO_GRANTS)
  const [loadingGrants, setLoadingGrants] = useState(true)
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      const { grants } = await loadGrants()
      if (active) {
        setFeatured(grants.slice(0, 10))
        setLoadingGrants(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = (user?.name || 'Entrepreneur').split(' ')[0]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleChatSubmit = (e) => {
    e.preventDefault()
    open(chatInput.trim())
    setChatInput('')
  }

  return (
    <PageShell wide>
      <PageHeader
        title={`${greeting},`}
        accent={firstName}
        subtitle="Here's what's happening with your business today."
        actions={
          <AppButton variant="danger" onClick={handleLogout}>
            <Icon name="logout" size={16} />
            Log out
          </AppButton>
        }
      />

      {trackers.length > 0 && (
        <section className="mb-7" aria-labelledby="tracker-heading">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="tracker-heading" className="m-0 text-lg font-bold text-ink-strong">
                Sena action plans
              </h2>
              <p className="m-0 text-sm text-muted">Check items off — progress updates here instantly.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {trackers.map((tracker) => {
              const { done, total, percent } = trackerProgress(tracker)
              return (
                <Link key={tracker.id} to={`/trackers/${tracker.id}`} className="no-underline">
                  <AppCard className="h-full">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="m-0 text-base font-semibold text-ink-strong">{tracker.title}</h3>
                      <span className="text-xs font-semibold text-muted">
                        {done}/{total}
                      </span>
                    </div>
                    <ProgressBar value={percent} label={`${tracker.title} progress`} />
                    <p className="mb-0 mt-2 text-sm font-medium text-prospera">{percent}% complete</p>
                  </AppCard>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <section className="mb-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="m-0 text-lg font-bold text-ink-strong">Opportunities for you</h2>
            <p className="m-0 text-sm text-muted">Hand-picked funding matched to your business.</p>
          </div>
          <AppButton variant="outline" onClick={() => navigate('/grants')}>
            View all grants
            <Icon name="arrowRight" size={16} />
          </AppButton>
        </div>
        {loadingGrants ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((key) => (
              <GrantSkeleton key={key} />
            ))}
          </div>
        ) : (
          <GrantCarousel grants={featured} />
        )}
      </section>

      <section className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => (
          <AppCard key={s.label} className="relative overflow-hidden">
            <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${s.from} ${s.to} opacity-20`} />
            <div className="mb-4 flex items-center justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${s.from} ${s.to} text-white`}>
                <Icon name={s.icon} size={20} />
              </div>
            </div>
            <span className="text-sm text-muted">{s.label}</span>
            <strong className="mt-1 block text-2xl tracking-tight text-ink-strong">{s.value}</strong>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <Icon name="trend" size={12} />
              {s.change}
            </span>
          </AppCard>
        ))}
      </section>

      <AppCard className="border-line">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-strong text-prospera">
            <Icon name="sparkles" size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="m-0 text-lg font-bold text-ink-strong">Ask your AI Coach</h3>
            <p className="m-0 text-sm text-muted">Ideas · grants · finances — ask for a plan and Sena will save a tracker.</p>
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => open(s)}
              className="rounded-full border border-line bg-canvas px-3 py-1.5 text-sm text-ink transition hover:-translate-y-0.5 hover:border-prospera hover:bg-prospera-soft"
            >
              {s}
            </button>
          ))}
        </div>
        <form className="flex flex-wrap gap-2" onSubmit={handleChatSubmit}>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type your question..."
            className="min-w-[200px] flex-1 rounded-xl border border-line bg-canvas px-3 py-2.5 text-ink"
          />
          <AppButton type="submit" disabled={!chatInput.trim()}>
            Ask AI
            <Icon name="send" size={15} />
          </AppButton>
        </form>
      </AppCard>
    </PageShell>
  )
}

export default Dashboard
