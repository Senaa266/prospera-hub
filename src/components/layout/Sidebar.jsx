import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTrackers } from '../../context/TrackersContext'
import Icon from '../icons'
import './Sidebar.css'

function Sidebar() {
  const { user } = useAuth()
  const { trackers } = useTrackers()
  const firstName = (user?.name || 'Entrepreneur').split(' ')[0]
  const latestTracker = trackers[0]
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
        { to: '/grants', icon: 'target', label: 'Grants' },
        { to: '/grants/eligibility', icon: 'shield', label: 'Eligibility' },
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
        <span className="logo-text">
          Prospera<span className="hub">Hub</span>
        </span>
      </Link>

      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <span className="nav-caption">{group.label}</span>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/grants' || item.to === '/dashboard'}
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
        {user?.avatar ? (
          <img className="profile-avatar profile-avatar-img" src={user.avatar} alt="" />
        ) : (
          <div className="profile-avatar">{firstName[0]}</div>
        )}
        <div className="profile-meta">
          <strong>{user?.name || 'Demo Entrepreneur'}</strong>
          <span>{user?.businessName || user?.businessType || 'Entrepreneur'}</span>
        </div>
        <Link to="/settings" className="profile-menu" aria-label="Open settings">
          <Icon name="gear" size={18} />
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar
