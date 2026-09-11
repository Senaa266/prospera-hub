import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="nav-app">
      <Link to="/dashboard" className="nav-app-logo">
        <span className="logo-mark">P</span>
        <span>Prospera<span className="hub">Hub</span></span>
      </Link>

      <div className="nav-app-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/grants">Grants</NavLink>
        <NavLink to="/savings">Savings</NavLink>
        <NavLink to="/suppliers">Suppliers</NavLink>
        <NavLink to="/finance">Finance</NavLink>
        <NavLink to="/ai-chat" className="nav-ai">🤖 AI Coach</NavLink>
      </div>

      <div className="nav-app-user">
        <span className="user-name">{user?.name || 'Entrepreneur'}</span>
        <button className="logout-btn" onClick={handleLogout} type="button">
          Log out
        </button>
      </div>
    </nav>
  )
}

export default Navbar