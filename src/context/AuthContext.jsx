import { createContext, useContext, useState } from 'react'
import { auth } from '../api/client'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem('user')) || null
  )
  const [token, setToken] = useState(localStorage.getItem('token'))

  const demoLogin = (userData) => {
    const demoUser = {
      id: 1,
      name: userData.name || 'Demo Entrepreneur',
      email: userData.email || 'demo@prospera.com',
      businessType: userData.businessType || 'startup',
    }
    const demoToken = 'demo-token'
    setToken(demoToken)
    setUser(demoUser)
    localStorage.setItem('token', demoToken)
    localStorage.setItem('user', JSON.stringify(demoUser))
  }

  const login = async (credentials) => {
    try {
      const res = await auth.login(credentials)
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
    } catch {
      demoLogin(credentials)
    }
  }

  const register = async (userData) => {
    try {
      const res = await auth.register(userData)
      setToken(res.token)
      setUser(res.user)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
    } catch {
      demoLogin(userData)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)