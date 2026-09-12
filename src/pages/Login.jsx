import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/icons'
import './Auth.css'

function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const switchMode = (next) => {
    setMode(next)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.email || !form.password) {
      setError('Email and password are required')
      return
    }
    if (mode === 'signup' && !form.name) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password })
      } else {
        await register({ ...form })
      }
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">P</span>
          <span className="auth-brand-name">ProsperaHub</span>
        </div>

        <div className="auth-toggle">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => switchMode('signup')}
          >
            Sign up
          </button>
        </div>

        <div className="auth-head">
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p>
            {mode === 'login'
              ? 'Log in to keep building your business.'
              : 'Join African women entrepreneurs saving, funding and scaling together.'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Ama Owusu"
                autoComplete="name"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="pass-wrap">
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                <Icon name={showPass ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <>
                {mode === 'login' ? 'Log in' : 'Create account'}
                <Icon name="arrowRight" size={17} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login