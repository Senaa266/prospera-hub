import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/icons'
import AIOffer from '../components/AIOffer'
import GrantCard from '../components/GrantCard'
import { EmptyState } from '../components/ui/EmptyState'
import { GrantSkeleton } from '../components/ui/Skeleton'
import { PageHeader } from '../components/ui/PageHeader'
import { PageShell } from '../components/ui/PageShell'
import { loadGrants } from '../utils/grants'
import { DEMO_GRANTS } from '../data/grants'

function Grants() {
  const [grants, setGrants] = useState(DEMO_GRANTS)
  const [live, setLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [sort, setSort] = useState('deadline')
  const [saved, setSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('savedGrants')) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const { grants: list, live: isLive } = await loadGrants()
        if (!active) return
        setGrants(list)
        setLive(isLive)
        setLoadError(isLive ? '' : 'Showing curated demo grants while live sources are offline.')
      } catch (error) {
        if (!active) return
        setGrants(DEMO_GRANTS)
        setLive(false)
        setLoadError(error?.message || 'Could not refresh grants. Showing demo matches.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const types = useMemo(() => {
    const set = new Set(grants.map((g) => g.type).filter(Boolean))
    return ['All', ...set]
  }, [grants])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = grants.filter((g) => {
      const haystack = `${g.title} ${g.description} ${g.source || ''} ${g.region || ''}`.toLowerCase()
      return (!q || haystack.includes(q)) && (type === 'All' || g.type === type)
    })
    if (sort === 'deadline') {
      list = [...list].sort(
        (a, b) =>
          (a.deadline === 'Rolling' ? Number.MAX_SAFE_INTEGER : new Date(a.deadline).getTime()) -
          (b.deadline === 'Rolling' ? Number.MAX_SAFE_INTEGER : new Date(b.deadline).getTime()),
      )
    } else if (sort === 'amount') {
      list = [...list].sort((a, b) => (b.amountMax || 0) - (a.amountMax || 0))
    } else if (sort === 'newest') {
      list = [...list].sort((a, b) => (b.id || 0) - (a.id || 0))
    }
    return list
  }, [grants, query, type, sort])

  const toggleSaved = (id) => {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
      localStorage.setItem('savedGrants', JSON.stringify(next))
      return next
    })
  }

  const resetFilters = () => {
    setQuery('')
    setType('All')
    setSort('deadline')
  }

  return (
    <PageShell wide>
      <PageHeader
        title="Grants"
        accent="& Funding"
        subtitle="Live opportunities from external funding sources. Filter, save and check fit."
        actions={
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-muted shadow-[var(--shadow-card)]">
            <span className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            {live ? 'Live · from the web' : 'Demo data'}
          </span>
        }
      />

      {loadError && !loading ? (
        <div className="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          <Icon name="external" size={16} />
          <p className="m-0">{loadError}</p>
        </div>
      ) : null}

      <div className="mb-4 rounded-2xl border border-line bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex flex-wrap gap-3">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search grants</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <Icon name="search" size={18} />
            </span>
            <input
              type="search"
              placeholder="Search grants, providers, regions…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-line bg-canvas py-2.5 pl-10 pr-3 text-ink"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 text-sm text-muted">
            <Icon name="sort" size={16} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border-0 bg-transparent py-2.5 text-ink"
            >
              <option value="deadline">Deadline (soonest)</option>
              <option value="amount">Amount (highest)</option>
              <option value="newest">Newest first</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Icon name="sliders" size={15} />
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                type === t
                  ? 'bg-ink-strong text-white'
                  : 'bg-canvas text-muted hover:-translate-y-0.5 hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>
          {filtered.length} grant{filtered.length === 1 ? '' : 's'}
          {type !== 'All' && ` · ${type}`}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold">
          <Icon name="bookmark" size={14} />
          {saved.length} saved
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading
          ? [1, 2, 3, 4].map((key) => <GrantSkeleton key={key} />)
          : filtered.map((g) => {
              const id = g.id ?? g.title
              return (
                <GrantCard key={id} grant={g} saved={saved.includes(id)} onToggleSaved={toggleSaved} />
              )
            })}
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title="No grants match your filters"
          description="Try a different keyword or reset the filters."
          actionLabel="Reset filters"
          onAction={resetFilters}
        />
      ) : null}

      <div className="mt-8">
        <AIOffer
          title="Not sure where to start?"
          text="Your AI coach ranks these grants against your business profile, drafts the application, and tracks every deadline for you."
          points={['Ranked by fit', 'Draft applications', 'Deadline reminders']}
        />
      </div>
    </PageShell>
  )
}

export default Grants
