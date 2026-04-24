// src/hooks/useConnection.ts
import { useEffect, useState } from 'react'
import { authClient } from '../lib/auth'

export interface Connection {
  id: string
  n8n_url: string
  verified: boolean
}

export function useConnection() {
  const [connection, setConnection] = useState<Connection | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchConnection = async () => {
    const { data: session } = await authClient.getSession()
    if (!session) { setLoading(false); return }

    const res = await fetch('/api/connection', {
      headers: { Authorization: `Bearer ${session.session.token}` },
    })
    if (res.ok) {
      setConnection(await res.json())
    } else {
      console.error('[useConnection] fetch failed:', res.status, res.statusText)
    }
    setLoading(false)
  }

  useEffect(() => { fetchConnection() }, [])

  return { connection, loading, refetch: fetchConnection }
}
