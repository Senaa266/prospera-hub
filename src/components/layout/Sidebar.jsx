import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Icon from '../icons'
import './Sidebar.css'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', icon: 'home', label: 'Dashboard' }],
  },
  {
    label: 'Business tools',
    items: [
      { to: '/grants', icon: 'target', label: 'Grants', badge: '4' },
      { to: '/savings', icon: 'wallet', label: 'Savings' },
      { to: '/suppliers', icon: 'users', label: 'Suppliers' },
      { to: '/finance', icon: 'chart', label: 'Finance' },
    ],
  },
  {
    label: 'Assistant',
    items: [{ to: '/ai-chat', icon: 'sparkles', label: 'AI Coach', badge: 'NEW', new: true }],
  },
]

function Sidebar() {
  const { user } = useAuth()
  const firstName = (user?.name || 'Entrepreneur').split(' ')[0]

  return (
    <aside className="sidebar">
      <Link to="/dashboard" className="sidebar-logo">
        <span className="logo-mark">P</span>
        <span className="logo-text">Prospera<span className="hub">Hub</span></span>
      </Link>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
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