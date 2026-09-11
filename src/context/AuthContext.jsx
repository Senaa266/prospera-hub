import { createContext, useContext, useState } from 'react'
import { auth } from '../api/client'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const storedToken = localStorage.getItem('token')
  const [token, setToken] = useState(storedToken)
  const [user, setUser] = useState(() =>
    storedToken ? JSON.parse(localStorage.getItem('user') || 'null') : null
  )

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

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)