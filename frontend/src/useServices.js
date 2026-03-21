import { useState, useEffect, useCallback, useRef } from 'react'
import { api, connectWs } from './api'

export function useServices() {
  const [services, setServices] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const logsRef = useRef({})

  const refresh = useCallback(async () => {
    const data = await api.getServices()
    setServices(data.services)
    setGroups(data.groups)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const ws = connectWs((msg) => {
      if (msg.type === 'status') {
        setServices((prev) =>
          prev.map((s) => (s.id === msg.id ? { ...s, status: msg.status } : s))
        )
      }
      if (msg.type === 'log') {
        setServices((prev) =>
          prev.map((s) => {
            if (s.id !== msg.id) return s
            const logs = [...(s.logs || []), msg.line]
            if (logs.length > 200) logs.shift()
            return { ...s, logs }
          })
        )
      }
    })
    return () => ws.close()
  }, [refresh])

  const start = async (id) => {
    await api.startService(id)
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'running' } : s)))
  }

  const stop = async (id) => {
    await api.stopService(id)
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'stopped' } : s)))
  }

  const restart = async (id) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'starting' } : s)))
    await api.restartService(id)
  }

  return { services, groups, loading, refresh, start, stop, restart, setGroups }
}
