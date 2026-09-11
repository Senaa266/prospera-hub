import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Icon from '../components/icons'
import AIOffer from '../components/AIOffer'
import GrantCard from '../components/GrantCard'
import { loadGrants } from '../utils/grants'
import { DEMO_GRANTS } from '../data/grants'
import './Grants.css'

function Grants() {
  const [grants, setGrants] = useState(DEMO_GRANTS)
  const [live, setLive] = useState(false)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [sort, setSort] = useState('deadline')
  const [expanded, setExpanded] = useState(null)
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
      const { grants: list, live: isLive } = await loadGrants()
      if (active) {
        setGrants(list)
        setLive(isLive)
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
          (b.deadline === 'Rolling' ? Number.MAX_SAFE_INTEGER : new Date(b.deadline).getTime())
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
    <div className="dashboard grants-page">
      <Sidebar />
      <main className="grant-main">
        <div className="dash-header">
          <div>
            <h1 className="greeting">
              Grants <span className="greet-name">&amp; Funding</span>
            </h1>
            <p className="dash-sub">Live opportunities from external funding sources. Filter, save and check fit.</p>
          </div>
          <span className="live-pill">
            <span className="live-dot" />
            {live ? 'Live · from the web' : 'Demo data'}
          </span>
        </div>

        {!live && (
          <div className="demo-banner">
            <Icon name="external" size={16} />
            <p>
              <strong>Offline.</strong> We couldn&apos;t reach the funding feed — showing demo data. Start the API
              and the live grants will stream here.
            </p>
          </div>
        )}

        <div className="filter-bar">
          <div className="filter-top">
            <div className="search-box">
              <Icon name="search" size={18} />
              <input
                type="text"
                placeholder="Search grants, providers, regions…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button className="clear-btn" type="button" onClick={() => setQuery('')} aria-label="Clear search">
                  <Icon name="x" size={16} />
                </button>
              )}
            </div>

            <div className="sort-box">
              <Icon name="sort" size={16} />
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="deadline">Deadline (soonest)</option>
                <option value="amount">Amount (highest)</option>
                <option value="newest">Newest first</option>
              </select>
            </div>
          </div>

          <div className="filter-types">
            <Icon name="sliders" size={15} />
            {types.map((t) => (
              <button
                key={t}
                className={`type-chip ${type === t ? 'active' : ''}`}
                type="button"
                onClick={() => setType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="results-meta">
          <span>
            {filtered.length} grant{filtered.length === 1 ? '' : 's'}
            {type !== 'All' && ` · ${type}`}
          </span>
          <span className="saved-count">
            <Icon name="bookmark" size={14} />
            {saved.length} saved
          </span>
        </div>

        <div className="grants-list">
          {filtered.map((g) => {
            const id = g.id ?? g.title
            return (
              <GrantCard
                key={id}
                grant={g}
                expanded={expanded === id}
                saved={saved.includes(id)}
                onToggleSaved={toggleSaved}
                onExplore={() => setExpanded((prev) => (prev === id ? null : id))}
              />
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <Icon name="search" size={30} />
            <h3>No grants match your filters</h3>
            <p>Try a different keyword or reset the filters to see everything.</p>
            <button type="button" className="btn-apply" onClick={resetFilters}>
              Reset filters
            </button>
          </div>
        )}

        <AIOffer
          title="Not sure where to start?"
          text="Your AI coach ranks these grants against your business profile, drafts the application, and tracks every deadline for you."
          points={['Ranked by fit', 'Draft applications', 'Deadline reminders']}
        />
      </main>
    </div>
  )
}

export default Grants