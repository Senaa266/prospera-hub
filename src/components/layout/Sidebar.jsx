import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTrackers } from '../../context/TrackersContext'
import Icon from '../icons'
import './Sidebar.css'

const readSavedCount = () => {
  try {
    return (JSON.parse(localStorage.getItem('savedGrants')) || []).length
  } catch {
    return 0
  }
}

function Sidebar() {
  const { user } = useAuth()
  const { trackers } = useTrackers()
  const [savedCount, setSavedCount] = useState(readSavedCount)
  const firstName = (user?.name || 'Entrepreneur').split(' ')[0]
  const latestTracker = trackers[0]

  useEffect(() => {
    const refresh = () => setSavedCount(readSavedCount())
    window.addEventListener('saved-grants-changed', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('saved-grants-changed', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const navGroups = [
    {
      label: 'Overview',
      items: [{ to: '/dashboard', icon: 'home', label: 'Dashboard' }],
    },
    {
      label: 'Business tools',
      items: [
        { to: '/suppliers', icon: 'users', label: 'Suppliers' },
        { to: '/savings', icon: 'wallet', label: 'Savings' },
        { to: '/finance', icon: 'chart', label: 'Finance' },
        {
          to: '/grants',
          icon: 'target',
          label: 'Grants',
          badge: savedCount > 0 ? String(savedCount) : undefined,
        },
      ],
    },
    {
      label: 'Assistant',
      items: [
        { to: '/ai-chat', icon: 'sparkles', label: 'AI Coach', badge: 'NEW', new: true },
        ...(latestTracker
          ? [{ to: `/trackers/${latestTracker.id}`, icon: 'check', label: 'Plans', badge: String(trackers.length) }]
          : []),
      ],
    },
  ]
  return (
    <aside className="sidebar">
      <Link to="/dashboard" className="sidebar-logo">
        <span className="logo-mark">P</span>
        <span className="logo-text">Prospera<span className="hub">Hub</span></span>
      </Link>

      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <span className="nav-caption">{group.label}</span>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
              >
                <span className="side-icon">
                  <Icon name={item.icon} size={19} />
                </span>
                <span className="side-label">{item.label}</span>
                {item.badge && (
                  <span className={`side-badge ${item.new ? 'new' : ''}`}>{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <Link to="/savings" className="sidebar-promo">
        <div className="promo-icon">
          <Icon name="wallet" size={20} />
        </div>
        <p className="promo-title">Save with a circle</p>
        <p className="promo-text">Transparent susu savings with your community.</p>
        <span className="promo-cta">
          Start saving
          <Icon name="chevron" size={14} />
        </span>
      </Link>

      <div className="sidebar-profile">
        <div className="profile-avatar">{firstName[0]}</div>
        <div className="profile-meta">
          <strong>{user?.name || 'Demo Entrepreneur'}</strong>
          <span>{user?.businessType || 'Entrepreneur'}</span>
        </div>
        <button className="profile-menu" type="button" aria-label="Settings">
          <Icon name="gear" size={18} />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar