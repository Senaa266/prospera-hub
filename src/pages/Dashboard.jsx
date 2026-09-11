import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import './Dashboard.css'

function Dashboard() {
  const modules = [
    {
      title: 'Grants & Funding',
      desc: 'Find grants matched to your business. Eligibility-check and apply.',
      link: '/grants',
      emoji: '🎯',
      color: '#0a7d4f',
    },
    {
      title: 'Susu Savings',
      desc: 'Join or start a transparent group savings circle.',
      link: '/savings',
      emoji: '💰',
      color: '#ff9f1c',
    },
    {
      title: 'Peer Supplier',
      desc: 'Bundle orders with similar businesses for bulk discounts.',
      link: '/suppliers',
      emoji: '🤝',
      color: '#2563eb',
    },
    {
      title: 'Financial tracking',
      desc: 'Record expenses, revenue and see AI insights.',
      link: '/finance',
      emoji: '📊',
      color: '#7c3aed',
    },
    {
      title: 'AI Business Coach',
      desc: 'Chat with your coach - ideas, plans and advice.',
      link: '/ai-chat',
      emoji: '🤖',
      color: '#b45309',
    },
    {
      title: 'Investments',
      desc: 'Put eligible savings to work with trusted partners.',
      link: '/savings',
      emoji: '📈',
      color: '#0e7490',
    },
  ]

  return (
    <div className="dashboard">
      <Navbar />
      <main className="dashboard-main">
        <h1>Welcome back 👋</h1>
        <p className="dashboard-sub">
          Everything for your business in one place.
        </p>

        <div className="quick-stats">
          <div className="stat-card">
            <span>Savings</span>
            <strong>GH₵ 0.00</strong>
          </div>
          <div className="stat-card">
            <span>Grants found</span>
            <strong>3</strong>
          </div>
          <div className="stat-card">
            <span>Business progress</span>
            <strong>35%</strong>
          </div>
        </div>

        <div className="modules-grid">
          {modules.map((m) => (
            <Link to={m.link} className="module-card" key={m.title}>
              <div className="module-emoji" style={{ background: `${m.color}1a` }}>
                {m.emoji}
              </div>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
              <span className="module-link" style={{ color: m.color }}>
                Open →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Dashboard