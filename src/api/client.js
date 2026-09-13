const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:5000')

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
  detail: (id, token) => client(`/savings/circles/${id}`, { token }),
  create: (data, token) => client('/savings', { method: 'POST', body: data, token }),
  join: (circleId, token) => client(`/savings/circles/${circleId}/join`, { method: 'POST', body: {}, token }),
  invite: (circleId, email, token) =>
    client('/savings/invite', { method: 'POST', body: { circleId, email }, token }),
  joinByInvite: (inviteToken, authToken) =>
    client(`/savings/invite/${inviteToken}/join`, { method: 'POST', body: {}, token: authToken }),
  simulate: (circleId, scenario, token) =>
    client(`/savings/circles/${circleId}/simulate`, {
      method: 'POST',
      body: scenario || {},
      token,
    }),
  pay: (circleId, token) => client(`/savings/circles/${circleId}/pay`, { method: 'POST', body: {}, token }),
  payNow: (data, token) => client('/savings/payments', { method: 'POST', body: data, token }),
  createGoal: (data, token) => client('/savings/goals', { method: 'POST', body: data, token }),
  invest: (data, token) => client('/savings/investments', { method: 'POST', body: data, token }),
  claim: (id, token) => client(`/savings/investments/${id}/claim`, { method: 'POST', body: {}, token }),
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
  fulfill: (groupId, token) => client(`/suppliers/${groupId}/fulfill`, { method: 'POST', token }),
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
  chat: (message, token) =>
    client('/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: message }], userContext: {} }, token }),
}

export default client
