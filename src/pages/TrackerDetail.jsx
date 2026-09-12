import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTrackers } from '../context/TrackersContext'
import { trackerProgress } from '../lib/trackerProgress'
import Icon from '../components/icons'
import { AppButton } from '../components/ui/AppButton'
import { AppCard } from '../components/ui/AppCard'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'
import { ProgressBar } from '../components/ui/ProgressBar'

function TrackerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trackers, toggleTask, removeTracker } = useTrackers()
  const tracker = trackers.find((item) => item.id === id)

  if (!tracker) {
    return (
      <PageShell>
        <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted no-underline hover:text-ink">
          <Icon name="arrowRight" size={14} className="rotate-180" />
          Back to dashboard
        </Link>
        <AppCard className="text-center">
          <p className="m-0 text-ink-strong">This tracker is no longer available.</p>
          <p className="mt-2 text-sm text-muted">Ask Sena for a new roadmap and it will appear here.</p>
          <AppButton className="mt-4" onClick={() => navigate('/ai-chat')}>
            Open AI Coach
          </AppButton>
        </AppCard>
      </PageShell>
    )
  }

  const { done, total, percent } = trackerProgress(tracker)

  return (
    <PageShell>
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted no-underline transition hover:text-ink"
      >
        ← Dashboard
      </Link>
      <PageHeader
        title={tracker.title}
        subtitle={`Created by Sena · ${new Date(tracker.createdAt).toLocaleDateString()}`}
        actions={
          <AppButton
            variant="outline"
            onClick={() => {
              removeTracker(tracker.id)
              navigate('/dashboard')
            }}
          >
            Remove tracker
          </AppButton>
        }
      />

      <AppCard className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-ink">
            {done} of {total} complete
          </span>
          <span className="text-muted">{percent}%</span>
        </div>
        <ProgressBar value={percent} label={`${tracker.title} progress`} />
      </AppCard>

      <ul className="m-0 grid list-none gap-3 p-0">
        {tracker.tasks.map((task) => (
          <li key={task.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(tracker.id, task.id)}
                className="mt-1 h-4 w-4 accent-prospera"
              />
              <span className={task.done ? 'text-muted line-through' : 'text-ink'}>{task.text}</span>
            </label>
          </li>
        ))}
      </ul>

      {percent === 100 && (
        <AppCard className="mt-5 border-emerald-200 bg-emerald-50">
          <strong className="text-emerald-800">This plan is complete.</strong>
          <p className="mb-0 mt-1 text-sm text-emerald-900">
            Ask Sena for the next 90-day stretch whenever you are ready.
          </p>
        </AppCard>
      )}
    </PageShell>
  )
}

export default TrackerDetail
