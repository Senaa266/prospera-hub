import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Icon from '../components/icons'
import AIOffer from '../components/AIOffer'
import { grants as grantsApi } from '../api/client'
import './Grants.css'

const favicon = (url) => {
  if (!url) return null
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`
  } catch {
    return null
  }
}

const DEMO_GRANTS = [
  {
    id: 1,
    title: 'Ghana Startup Grant',
    amount: 'GH₵ 5,000 – GH₵ 25,000',
    amountMax: 25000,
    deadline: '2026-09-30',
    type: 'Tech / Innovation',
    region: 'Ghana',
    source: 'Ghana Enterprises Agency',
    externalUrl: 'https://gea.gov.gh',
    description: 'Available to registered Ghanaian startups under 3 years old building tech solutions.',
    eligibility: 'Registered business in Ghana, < 3 years old, technology or digital solution, max 15 employees.',
  },
  {
    id: 2,
    title: 'AfDB Youth Entrepreneurship',
    amount: 'GH₵ 10,000 – GH₵ 100,000',
    amountMax: 100000,
    deadline: '2026-11-15',
    type: 'All sectors',
    region: 'Pan-Africa',
    source: 'African Development Bank',
    externalUrl: 'https://afdb.org',
    description: 'Open to 18–35 year-old entrepreneurs across Africa with a viable business plan.',
    eligibility: 'African national, aged 18–35, viable business plan, personal contribution of 10%.',
  },
  {
    id: 3,
    title: 'Google for Startups Africa',
    amount: '$10,000 – $50,000',
    amountMax: 50000,
    deadline: 'Rolling',
    type: 'Tech / Digital',
    region: 'Pan-Africa',
    source: 'Google',
    externalUrl: 'https://startup.google.com',
    description: 'For digital-first startups solving local problems in Africa.',
    eligibility: 'Digital-first product, HQ or meaningful operations in Africa, pre-seed to Series A.',
  },
  {
    id: 4,
    title: 'Tony Elumelu Entrepreneurship Programme',
    amount: '$5,000 seed capital',
    amountMax: 5000,
    deadline: '2027-01-15',
    type: 'All sectors',
    region: 'Pan-Africa',
    source: 'Tony Elumelu Foundation',
    externalUrl: 'https://www.tefconnect.com',
    description: 'Seed funding plus business mentorship for African startups and early-stage businesses.',
    eligibility: 'African entrepreneur, business idea or nascent venture, 21+. Mentorship agreement required.',
  },
  {
    id: 5,
    title: 'Women in Innovation Fund',
    amount: '$10,000 grant',
    amountMax: 10000,
    deadline: '2026-09-15',
    type: 'Women-led',
    region: 'Pan-Africa',
    source: 'Shexport Foundation',
    externalUrl: 'https://shexport.org',
    description: 'Dedicated funding for women-led ventures tackling export and supply chain gaps.',
    eligibility: 'Woman-owned (≥51%), export or supply-chain focus, proof of revenue or customers.',
  },
  {
    id: 6,
    title: 'Ghana Enterprises Agency Boost',
    amount: 'GH₵ 3,000 – GH₵ 15,000',
    amountMax: 15000,
    deadline: '2026-12-01',
    type: 'Small business',
    region: 'Ghana',
    source: 'GEA',
    externalUrl: 'https://gea.gov.gh',
    description: 'Working-capital grants for micro and small enterprises recovering and scaling operations.',
    eligibility: 'Registered MSSE, 2+ years of operations, annual turnover under GH₵ 1M.',
  },
  {
    id: 7,
    title: 'She Leads Africa Grant',
    amount: '$5,000',
    amountMax: 5000,
    deadline: '2026-10-10',
    type: 'Women-led',
    region: 'Pan-Africa',
    source: 'She Leads Africa',
    externalUrl: 'https://sheleadsafrica.org',
    description: 'Cash grant and cohort support for female founders in fast-growing industries.',
    eligibility: 'Female founder or co-founder, operational business, attend 6-week growth cohort.',
  },
  {
    id: 8,
    title: 'Orange Corners Incubator',
    amount: '$5,000 + incubation',
    amountMax: 5000,
    deadline: '2026-12-20',
    type: 'Agri-business',
    region: 'West Africa',
    source: 'Orange Corners',
    externalUrl: 'https://www.orangecorners.com',
    description: 'For agri-business startups, with incubation support and market access programmes.',
    eligibility: 'Agri-value-chain business, registered, ready for incubation in West Africa.',
  },
  {
    id: 9,
    title: 'Meta Business Boost Africa',
    amount: 'US$250 + training',
    amountMax: 250,
    deadline: 'Rolling',
    type: 'Digital',
    region: 'Pan-Africa',
    source: 'Meta',
    externalUrl: 'https://about.meta.com',
    description: 'Small ad-budget grants plus digital skills training for growing SMBs on Meta platforms.',
    eligibility: 'SMB with active Meta business account, any sector, Africa-based.',
  },
]

const imageFor = (g) => g.image || g.imageUrl || favicon(g.externalUrl)

function formatDeadline(date) {
  if (!date || date === 'Rolling') return 'Rolling'
  const d = new Date(date)
  if (isNaN(d)) return date
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isUrgent(date) {
  if (!date || date === 'Rolling') return false
  const diff = new Date(date).getTime() - Date.now()
  return diff > 0 && diff < 1000 * 60 * 60 * 24 * 14
}

function Grants() {
  const [grants, setGrants] = useState(DEMO_GRANTS)
  const [live, setLive] = useState(false)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const [sort, setSort] = useState('deadline')
  const [expanded, setExpanded] = useState(null)
  const [broken, setBroken] = useState(() => new Set())
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
        const token = localStorage.getItem('token')
        const data = await grantsApi.list(token)
        if (active && Array.isArray(data?.grants) && data.grants.length) {
          setGrants(data.grants)
          setLive(true)
        }
      } catch {
        /* offline demo fallback */
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
            {live ? 'Live · from database' : 'Demo data'}
          </span>
        </div>

        {!live && (
          <div className="demo-banner">
            <Icon name="external" size={16} />
            <p>
              <strong>Demo mode.</strong> Start the API (`npm run server`) and seed the database (`npm run seed`) —
              the 10 verified grants will stream here with images pulled from their external links.
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
            const img = imageFor(g)
            const failed = broken.has(id)
            return (
              <article className="grant-card" key={id}>
                <div className="grant-cover">
                  {img && !failed ? (
                    <img src={img} alt={`${g.title} logo`} onError={() => setBroken((prev) => new Set(prev).add(id))} />
                  ) : (
                    <div className="grant-cover-ph">
                      <Icon name="target" size={30} />
                    </div>
                  )}
                  <span className="grant-type-pill">{g.type}</span>
                  <button
                    className={`bookmark-btn ${saved.includes(id) ? 'saved' : ''}`}
                    type="button"
                    onClick={() => toggleSaved(id)}
                    aria-label={saved.includes(id) ? 'Remove from saved' : 'Save for later'}
                  >
                    <Icon name="bookmark" size={16} />
                  </button>
                </div>

                <div className="grant-body">
                  <span className="grant-source-label">{g.source}</span>
                  <h3>{g.title}</h3>
                  <p className="grant-desc">{g.description}</p>
                  <div className="grant-meta">
                    <span className="grant-amount">
                      <Icon name="wallet" size={16} />
                      {g.amount}
                    </span>
                    <span className={`grant-deadline ${isUrgent(g.deadline) ? 'urgent' : ''}`}>
                      <Icon name="clock" size={15} />
                      {isUrgent(g.deadline) && 'Closing soon · '}
                      {formatDeadline(g.deadline)}
                    </span>
                  </div>
                </div>

                <div className="grant-foot">
                  <span className="grant-region">
                    <Icon name="chart" size={14} />
                    {g.region}
                  </span>
                  <button
                    className="btn-view-details"
                    type="button"
                    onClick={() => setExpanded(expanded === id ? null : id)}
                  >
                    <Icon name={expanded === id ? 'x' : 'chevron'} size={16} />
                    {expanded === id ? 'Close details' : 'View details'}
                  </button>
                </div>

                {expanded === id && (
                  <div className="grant-details">
                    <div className="eligibility-block">
                      <span className="eligibility-tag">
                        <Icon name="shield" size={14} />
                        Eligibility
                      </span>
                      <p>{g.eligibility || 'Contact the provider for full eligibility criteria.'}</p>
                      <a className="btn-official" href={g.externalUrl || '#'} target="_blank" rel="noreferrer">
                        <Icon name="external" size={15} />
                        Apply on the official page
                      </a>
                    </div>
                  </div>
                )}
              </article>
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