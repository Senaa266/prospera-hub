const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const client = async (endpoint, { method = 'GET', body, token } = {}) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

export const auth = {
  login: (credentials) => client('/auth/login', { method: 'POST', body: credentials }),
  register: (user) => client('/auth/register', { method: 'POST', body: user }),
}

export const grants = {
  list: (token) => client('/grants', { token }),
}

export const savings = {
  list: (token) => client('/savings', { token }),
  create: (data, token) => client('/savings', { method: 'POST', body: data, token }),
}

export const suppliers = {
  list: (token) => client('/suppliers', { token }),
  createOrder: (data, token) => client('/supplier-orders', { method: 'POST', body: data, token }),
}

export const finance = {
  list: (token) => client('/finance', { token }),
}

export const ai = {
  chat: (message, token) => client('/ai/chat', { method: 'POST', body: { message }, token }),
}

export default client