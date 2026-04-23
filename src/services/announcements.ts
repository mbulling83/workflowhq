import { readApiError } from '@/lib/readApiError'

export interface FeatureAnnouncement {
  id: number | string
  title: string
  message: string
  ctaLabel: string | null
  ctaUrl: string | null
  createdAt: string
}

interface LatestAnnouncementResponse {
  announcement: FeatureAnnouncement | null
  hasSeen: boolean
}

interface CreateAnnouncementInput {
  title: string
  message: string
  ctaLabel?: string
  ctaUrl?: string
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function fetchLatestAnnouncement(token: string): Promise<LatestAnnouncementResponse> {
  const response = await fetch('/api/announcements', {
    method: 'GET',
    headers: authHeaders(token),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }

  return response.json() as Promise<LatestAnnouncementResponse>
}

export async function createAnnouncement(token: string, payload: CreateAnnouncementInput): Promise<void> {
  const response = await fetch('/api/announcements', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
}

export async function markAnnouncementSeen(token: string, announcementId: number | string): Promise<void> {
  const response = await fetch('/api/announcements/seen', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ announcementId }),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
}
