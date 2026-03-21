const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.json()
}

export const api = {
  getServices: () => request('/services'),
  createService: (svc) => request('/services', { method: 'POST', body: JSON.stringify(svc) }),
  updateService: (id, svc) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(svc) }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE' }),
  startService: (id) => request(`/services/${id}/start`, { method: 'POST' }),
  stopService: (id) => request(`/services/${id}/stop`, { method: 'POST' }),
  restartService: (id) => request(`/services/${id}/restart`, { method: 'POST' }),
  updateGroups: (groups) => request('/groups', { method: 'PUT', body: JSON.stringify({ groups }) }),
}

export function connectWs(onMessage) {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${protocol}//${location.host}/ws`)
  ws.onmessage = (e) => onMessage(JSON.parse(e.data))
  ws.onclose = () => setTimeout(() => connectWs(onMessage), 2000)
  return ws
}
