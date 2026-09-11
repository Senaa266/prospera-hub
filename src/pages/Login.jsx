import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', businessType: '' })
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'login') {
      login({ email: form.email, password: form.password })
    } else {
      register(form)
    }
    navigate('/dashboard')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="auth-sub">
          {mode === 'login'
            ? 'Log in to your Prospera Hub account'
            : 'Join the platform for African entrepreneurs'}
        </p>

        <div className="auth-tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
            type="button"
          >
            Log in
          </button>
          <button
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
            type="button"
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label>Full name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
              />
              <label>Industry</label>
              <select name="businessType" value={form.businessType} onChange={handleChange}>
                <option value="">Select your industry</option>
                <option value="beads">Beads & jewellery</option>
                <option value="food">Food & catering</option>
                <option value="fashion">Fashion & clothing</option>
                <option value="retail">Retail / shop</option>
                <option value="services">Services</option>
                <option value="startup">Startup / idea (not yet started)</option>
              </select>
            </>
          )}
          <label>Email</label>
          <input
            name="email"
            type="text"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
          />
          <label>Password</label>
          <input
            name="password"
            type="text"
            value={form.password}
            onChange={handleChange}
            placeholder="Any password works in demo mode"
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-submit" type="submit">
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login