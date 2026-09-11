import { Link } from 'react-router-dom'
import './Landing.css'

function Landing() {
  const features = [
    {
      icon: '🎯',
      title: 'Grants Discovery',
      desc: 'Find grants and funding opportunities matched to your business - you decide if you qualify.',
    },
    {
      icon: '🤖',
      title: 'AI Business Coach',
      desc: 'Voice and text chatbot that answers questions, guides your startup idea, and builds your action plan.',
    },
    {
      icon: '💰',
      title: 'Transparent Susu Savings',
      desc: 'Digital group savings with full transparency - who paid, who hasnt, and exactly what each person gets.',
    },
    {
      icon: '🤝',
      title: 'Peer Supplier',
      desc: 'Join forces with similar businesses to buy in bulk and unlock supplier discounts together.',
    },
    {
      icon: '📊',
      title: 'Financial Intelligence',
      desc: 'Log expenses, profits and revenue - get AI-generated insights and financial statements.',
    },
    {
      icon: '📈',
      title: 'Investment Access',
      desc: 'Eligible savers can invest through partner banks and companies, with returns paid in-app.',
    },
  ]

  return (
    <div className="landing">
      <nav className="nav">
        <div className="nav-logo">
          <span className="logo-mark">P</span>
          <span className="logo-text">Prospera<span className="hub">Hub</span></span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link to="/login" className="btn-nav-login">Log in</Link>
          <Link to="/login" className="btn-nav-signup">Get started</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-card">
          <div className="hero-card-bg">
            <div className="hero-card-overlay" />
          </div>
          <div className="hero-content">
            <span className="hero-badge">
              <span className="badge-dot" /> For African entrepreneurs
            </span>
            <h1>
              Small businesses. <span className="highlight">Bigger opportunities.</span>
            </h1>
            <p>
              Grants you never knew existed. Savings you can trust. AI that builds your
              business with you. And supplier discounts earned together.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn-primary">Start your business</Link>
              <a href="#features" className="btn-secondary btn-secondary-light">
                Explore features
              </a>
            </div>
          </div>
        </div>

        <div className="hero-stat-block">
          <div className="stat-block-head">
            <span className="stat-block-icon">📊</span>
            <span>Prospera Hub at a glance</span>
          </div>
          <div className="stat-row">
            <strong>20+</strong>
            <span>curated grants</span>
          </div>
          <div className="stat-row">
            <strong>100%</strong>
            <span>payment transparency</span>
          </div>
          <div className="stat-row">
            <strong>31%</strong>
            <span>avg. supplier savings</span>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <h2>Everything your business needs</h2>
        <p className="section-sub">One platform for funding, savings, advice and growth.</p>
        <div className="features-grid">
          {features.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="how">
        <h2>How it works</h2>
        <div className="how-grid">
          <div className="how-step">
            <span className="step-num">1</span>
            <h3>Create your business profile</h3>
            <p>Tell us what you sell and your goals.</p>
          </div>
          <div className="how-step">
            <span className="step-num">2</span>
            <h3>Get funding + save</h3>
            <p>Discover grants, join a susu circle, invest.</p>
          </div>
          <div className="how-step">
            <span className="step-num">3</span>
            <h3>Grow with suppliers</h3>
            <p>Partner with peers to unlock bulk discounts.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>Prospera Hub — built for African entrepreneurs</p>
      </footer>
    </div>
  )
}

export default Landing