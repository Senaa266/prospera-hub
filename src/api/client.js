const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function readBody(response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: text.slice(0, 200) || 'Request failed' }
  }
}

const client = async (endpoint, { method = 'GET', body, token } = {}) => {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_URL}/api${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Network error. Check your connection and try again.')
  }

  const data = await readBody(response)

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    throw new Error(data.message || `Request failed (${response.status})`)
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
  detail: (id, token) => client(`/suppliers/${id}`, { token }),
  createGroup: (data, token) => client('/suppliers', { method: 'POST', body: data, token }),
  join: (groupId, qty, note, token) =>
    client('/suppliers/join', { method: 'POST', body: { groupId, qty, note }, token }),
  approve: (groupId, orderId, token) =>
    client(`/suppliers/${groupId}/approve`, { method: 'POST', body: { orderId }, token }),
  reject: (groupId, orderId, token) =>
    client(`/suppliers/${groupId}/reject`, { method: 'POST', body: { orderId }, token }),
  updateShare: (groupId, qty, token) =>
    client(`/suppliers/${groupId}/share`, { method: 'POST', body: { qty }, token }),
  messages: (groupId, token) => client(`/suppliers/${groupId}/messages`, { token }),
  sendMessage: (groupId, text, channel, token) =>
    client(`/suppliers/${groupId}/messages`, { method: 'POST', body: { text, channel }, token }),
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
