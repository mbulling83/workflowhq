import { authClient } from '../lib/auth'
import { readApiError } from '../lib/readApiError'

export type FeedbackCategory = 'feedback' | 'bug' | 'idea' | 'question'

export type FeedbackSubmission = {
  id: number
  created_at: string
  category: FeedbackCategory
  message: string
  page_path: string | null
  page_url: string | null
  user_id: string | null
  email: string | null
  used_voice_input: boolean
}

export async function fetchFeedbackInbox(params?: {
  category?: FeedbackCategory | 'all'
  limit?: number
}): Promise<FeedbackSubmission[]> {
  const { data: session } = await authClient.getSession()
  if (!session) {
    throw new Error('Not authenticated')
  }

  const searchParams = new URLSearchParams()
  if (params?.category && params.category !== 'all') {
    searchParams.set('category', params.category)
  }
  if (params?.limit) {
    searchParams.set('limit', String(params.limit))
  }

  const query = searchParams.toString()
  const response = await fetch(`/api/feedback${query ? `?${query}` : ''}`, {
    headers: {
      Authorization: `Bearer ${session.session.token}`,
    },
  })
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  const data = (await response.json()) as { data: FeedbackSubmission[] }
  return data.data ?? []
}
