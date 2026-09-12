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
    const session = await auth.login(credentials)
    persistSession(session)
  }

  const register = async (userData) => {
    const session = await auth.register(userData)
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
