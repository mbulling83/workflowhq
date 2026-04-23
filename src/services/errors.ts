import { authClient } from '../lib/auth'
import { readApiError } from '../lib/readApiError'

export type AppErrorLog = {
  id: number
  created_at: string
  source: string
  category: string
  route: string | null
  method: string | null
  status_code: number | null
  user_id: string | null
  email: string | null
  error_message: string
  error_stack: string | null
}

export async function fetchBugInbox(params?: {
  source?: string | 'all'
  limit?: number
}): Promise<AppErrorLog[]> {
  const { data: session } = await authClient.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const searchParams = new URLSearchParams()
  if (params?.source && params.source !== 'all') {
    searchParams.set('source', params.source)
  }
  if (params?.limit) {
    searchParams.set('limit', String(params.limit))
  }

  const query = searchParams.toString()
  const response = await fetch(`/api/errors${query ? `?${query}` : ''}`, {
    headers: {
      Authorization: `Bearer ${session.session.token}`,
    },
  })
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  const data = (await response.json()) as { data: AppErrorLog[] }
  return data.data ?? []
}
