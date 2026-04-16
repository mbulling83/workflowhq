// src/hooks/useConnection.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Connection {
  id: string
  n8n_url: string
  verified: boolean
}

export function useConnection() {
  const { user } = useAuth()
  const [connection, setConnection] = useState<Connection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    supabase
      .from('user_connections')
      .select('id, n8n_url, verified')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setConnection(data)
        setLoading(false)
      })
  }, [user])

  return { connection, loading, refetch: () => setLoading(true) }
}
