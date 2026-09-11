import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import Sidebar from '../components/layout/Sidebar'
import Icon from '../components/icons'
import './Dashboard.css'

const GRANTS = [
  {
    title: 'Ghana Startup Grant',
    tag: 'Tech · Innovation',
    desc: 'Up to GH₵ 25,000 for registered startups under 3 years building tech solutions.',
    amount: 'GH₵ 5,000 – 25,000',
    deadline: 'Closes 30 Sep 2026',
    gradient: 'linear-gradient(120deg, #0e0e11 0%, #f10178 135%)',
  },
  {
    title: 'AfDB Youth Fund',
    tag: 'All sectors',
    desc: 'For African entrepreneurs aged 18–35 with a strong business plan.',
    amount: 'GH₵ 10,000 – 100,000',
    deadline: 'Closes 15 Nov 2026',
    gradient: 'linear-gradient(120deg, #4338ca 0%, #1e1b4b 100%)',
  },
  {
    title: 'Google Africa Fund',
    tag: 'Digital · Tech',
    desc: 'Equity-free funding for digital-first startups solving local problems.',
    amount: '$10,000 – 50,000',
    deadline: 'Rolling applications',
    gradient: 'linear-gradient(120deg, #16080e 0%, #be185d 160%)',
  },
  {
    title: 'Women-Led Business Boost',
    tag: 'Women entrepreneurs',
    desc: 'Grants for women-owned businesses in retail, food and crafts.',
    amount: 'GH₵ 8,000 – 20,000',
    deadline: 'Closes 22 Oct 2026',
    gradient: 'linear-gradient(120deg, #1e1b4b 0%, #f10178 135%)',
  },
]

const STATS = [
  { label: 'Total savings', value: 'GH₵ 2,450', icon: 'wallet', change: '+12% this week', grad: 'linear-gradient(135deg,#e11d48,#9f1239)' },
  { label: 'Grants matched', value: '3', icon: 'target', change: '2 new this month', grad: 'linear-gradient(135deg,#fb7185,#e11d48)' },
  { label: 'Business progress', value: '35%', icon: 'rocket', change: '5 steps left', grad: 'linear-gradient(135deg,#9f1239,#4a044e)' },
  { label: 'Revenue this month', value: 'GH₵ 1,250', icon: 'trend', change: '+18% vs last month', grad: 'linear-gradient(135deg,#e11d48,#fb7185)' },
]

const SUGGESTIONS = ['How do I start my bead business?', 'Which grants fit my business?', 'Explain susu savings']

function Dashboard() {
  const { user, logout } = useAuth()
  const { open } = useChat()
  const navigate = useNavigate()
  const [bannerIndex, setBannerIndex] = useState(0)
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    const timer = setInterval(() => setBannerIndex((prev) => (prev + 1) % GRANTS.length), 5000)
    return () => clearInterval(timer)
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

  const banner = GRANTS[bannerIndex]

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

        <div className="grant-banner">
          <div className="banner-inner" key={bannerIndex} style={{ background: banner.gradient }}>
            <div className="banner-content">
              <span className="banner-tag">{banner.tag}</span>
              <h2>{banner.title}</h2>
              <p>{banner.desc}</p>
              <div className="banner-meta">
                <span className="banner-amount">{banner.amount}</span>
                <span className="banner-deadline">
                  <Icon name="clock" size={14} />
                  {banner.deadline}
                </span>
                <span className="banner-cta">
                  View details <Icon name="chevron" size={14} />
                </span>
              </div>
            </div>
            <div className="banner-deco">
              <span className="deco-ring" />
              <span className="deco-ring deco-ring-2" />
              <span className="deco-bar" />
              <span className="deco-bar deco-bar-2" />
            </div>
          </div>
          <div className="banner-dots">
            {GRANTS.map((g, i) => (
              <button
                key={i}
                type="button"
                className={`banner-dot ${i === bannerIndex ? 'active' : ''}`}
                onClick={() => setBannerIndex(i)}
                aria-label={`Grant ${i + 1}`}
              />
            ))}
          </div>
        </div>

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
              <button
                key={s}
                type="button"
                onClick={() => open(s)}
              >
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