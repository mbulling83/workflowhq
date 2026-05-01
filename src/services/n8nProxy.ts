// src/services/n8nProxy.ts
import { authClient } from '../lib/auth'
import { readApiError } from '../lib/readApiError'
import type { Workflow } from '@n8n/ui'

export class UnauthorizedError extends Error {
  constructor() {
    super('Session expired')
    this.name = 'UnauthorizedError'
  }
}

async function callProxy(body: Record<string, unknown>): Promise<Response> {
  const { data: session } = await authClient.getSession()
  if (!session) throw new UnauthorizedError()

  const response = await fetch('/api/n8n-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.session.token}`,
    },
    body: JSON.stringify(body),
  })
  return response
}

export async function verifyConnection(n8nUrl: string, apiKey: string): Promise<void> {
  const response = await callProxy({ action: 'verify', n8nUrl, apiKey })
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
}

export class NoConnectionError extends Error {}

export async function fetchWorkflows(): Promise<Workflow[]> {
  const response = await callProxy({ action: 'list' })
  if (response.status === 401) throw new UnauthorizedError()
  if (response.status === 404) throw new NoConnectionError()
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
  const data = await response.json()
  return data.data as Workflow[]
}

export async function updateWorkflow(workflowId: string, payload: Partial<Workflow>): Promise<Workflow> {
  const response = await callProxy({ action: 'update', workflowId, payload })
  if (response.status === 401) throw new UnauthorizedError()
  if (!response.ok) {
    throw new Error(await readApiError(response))
  }
  return response.json() as Promise<Workflow>
}
