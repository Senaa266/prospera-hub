import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/layout/Sidebar'
import Icon from '../components/icons'
import GrantCard from '../components/GrantCard'
import { loadGrants } from '../utils/grants'
import { DEMO_GRANTS } from '../data/grants'
import './Dashboard.css'

const STATS = [
  { label: 'Total savings', value: 'GH₵ 2,450', icon: 'wallet', change: '+12% this week', grad: 'linear-gradient(135deg,#e11d48,#9f1239)' },
  { label: 'Grants matched', value: '3', icon: 'target', change: '2 new this month', grad: 'linear-gradient(135deg,#fb7185,#e11d48)' },
  { label: 'Business progress', value: '35%', icon: 'rocket', change: '5 steps left', grad: 'linear-gradient(135deg,#9f1239,#4a044e)' },
  { label: 'Revenue this month', value: 'GH₵ 1,250', icon: 'trend', change: '+18% vs last month', grad: 'linear-gradient(135deg,#e11d48,#fb7185)' },
]

const SUGGESTIONS = ['How do I start my bead business?', 'Which grants fit my business?', 'Explain susu savings']

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [featured, setFeatured] = useState(DEMO_GRANTS.slice(0, 4))
  const [featuredLive, setFeaturedLive] = useState(false)
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      const { grants, live } = await loadGrants()
      if (active) {
        setFeatured(grants.slice(0, 4))
        setFeaturedLive(live)
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
    navigate('/ai-chat')
  }

  return (
    <div className="dashboard">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dash-header">
          <div>
            <h1 className="greeting">
              {greeting}, <span className="greet-name">{firstName}</span>
            </h1>
            <p className="dash-sub">Here's what's happening with your business today.</p>
          </div>
          <button className="logout-btn" onClick={handleLogout} type="button">
            <Icon name="logout" size={16} />
            Log out
          </button>
        </header>

        <section className="dash-grants">
          <div className="section-head">
            <div>
              <h2>Opportunities for you</h2>
              <p>Hand-picked funding pulled live from external sources.</p>
            </div>
            <div className="section-actions">
              <span className="live-pill">
                <span className="live-dot" />
                {featuredLive ? 'Live' : 'Demo'}
              </span>
              <button className="view-all" type="button" onClick={() => navigate('/grants')}>
                View all grants
                <Icon name="arrowRight" size={16} />
              </button>
            </div>
          </div>

          <div className="dash-grants-grid">
            {featured.map((g) => (
              <GrantCard key={g.id ?? g.title} grant={g} onExplore={() => navigate('/grants')} />
            ))}
          </div>
        </section>

        <section className="stats-grid">
          {STATS.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-glow" style={{ background: s.grad }} />
              <div className="stat-card-top">
                <div className="stat-icon" style={{ background: s.grad }}>
                  <Icon name={s.icon} size={20} />
                </div>
                <span className="stat-chart" style={{ background: s.grad.replace('linear-gradient', 'radial-gradient') }}>
                  <span className="chart-col" />
                  <span className="chart-col c2" />
                  <span className="chart-col c3" />
                </span>
              </div>
              <span className="stat-label">{s.label}</span>
              <strong className="stat-value">{s.value}</strong>
              <span className="stat-change">
                <Icon name="trend" size={12} />
                {s.change}
              </span>
            </div>
          ))}
        </section>

        <section className="ai-card">
          <div className="ai-card-top">
            <div className="ai-avatar">
              <Icon name="sparkles" size={22} />
            </div>
            <div className="ai-title">
              <h3>Ask your AI Coach</h3>
              <p>Ideas · grants · finances · suppliers — ask anything and get a plan.</p>
            </div>
            <span className="ai-status">
              <span className="status-dot" />
              Online
            </span>
          </div>

          <div className="ai-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => navigate('/ai-chat')}>
                {s}
              </button>
            ))}
          </div>

          <form className="ai-input-row" onSubmit={handleChatSubmit}>
            <button className="voice-btn" type="button" aria-label="Voice input">
              <Icon name="mic" size={18} />
            </button>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your question..."
            />
            <button className="send-btn" type="submit" disabled={!chatInput.trim()}>
              Ask AI
              <Icon name="send" size={15} />
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}

export default Dashboard