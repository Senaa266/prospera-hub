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
  join: (circleId, token) => client('/savings/join', { method: 'POST', body: { circleId }, token }),
}

export const suppliers = {
  list: (token) => client('/suppliers', { token }),
  createGroup: (data, token) => client('/suppliers', { method: 'POST', body: data, token }),
  join: (groupId, qty, token) =>
    client('/suppliers/join', { method: 'POST', body: { groupId, qty }, token }),
}

export const finance = {
  list: (token) => client('/finance', { token }),
  add: (data, token) => client('/finance', { method: 'POST', body: data, token }),
  report: (token) => client('/finance/report', { token }),
}

export const ai = {
  chat: (message, token) => client('/ai/chat', { method: 'POST', body: { message }, token }),
}

export default client