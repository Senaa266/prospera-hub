import { createContext, useContext, useState } from 'react'
import { auth } from '../api/client'

const AuthContext = createContext(null)

function readStoredUser(hasToken) {
  if (!hasToken) return null
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return null
  }
}

function demoSession({ name, email }) {
  const safeEmail = String(email || 'demo@prospera.com').trim().toLowerCase()
  const safeName = String(name || safeEmail.split('@')[0] || 'Entrepreneur').trim()
  return {
    token: 'demo-token',
    user: {
      id: 1,
      name: safeName,
      email: safeEmail,
      businessType: 'Retail / trade',
      role: 'entrepreneur',
    },
  }
}

async function withDemoFallback(action, fallback) {
  try {
    return await action()
  } catch (error) {
    const message = String(error?.message || '')
    const offline =
      /network error|failed to fetch|request failed|load failed|connection/i.test(message)
    if (!offline) throw error
    return fallback()
  }
}

export function AuthProvider({ children }) {
  const storedToken = localStorage.getItem('token')
  const initialUser = readStoredUser(Boolean(storedToken))
  const [token, setToken] = useState(initialUser ? storedToken : null)
  const [user, setUser] = useState(initialUser)

  const persistSession = (session) => {
    setToken(session.token)
    setUser(session.user)
    localStorage.setItem('token', session.token)
    localStorage.setItem('user', JSON.stringify(session.user))
  }

  const login = async (credentials) => {
    const session = await withDemoFallback(
      () => auth.login(credentials),
      () => demoSession({ email: credentials.email, name: credentials.email?.split('@')[0] }),
    )
    persistSession(session)
  }

  const register = async (userData) => {
    const session = await withDemoFallback(
      () => auth.register(userData),
      () => demoSession(userData),
    )
    persistSession(session)
  }

  const updateUser = (patch) => {
    setUser((current) => {
      const next = { ...(current || {}), ...patch }
      localStorage.setItem('user', JSON.stringify(next))
      return next
    })
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
