// src/services/n8nProxy.ts
import { supabase } from '../lib/supabase'
import type { Workflow } from '@n8n/ui'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-proxy`

async function callProxy(body: Record<string, unknown>): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  })

  return response
}

export async function verifyConnection(n8nUrl: string, apiKey: string): Promise<void> {
  const response = await callProxy({ action: 'verify', n8nUrl, apiKey })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || `Connection failed: ${response.status}`)
  }
}

export async function fetchWorkflows(): Promise<Workflow[]> {
  const response = await callProxy({ action: 'list' })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || `Failed to fetch workflows: ${response.status}`)
  }
  const data = await response.json()
  return data.data as Workflow[]
}

export async function updateWorkflow(workflowId: string, payload: Partial<Workflow>): Promise<Workflow> {
  const response = await callProxy({ action: 'update', workflowId, payload })
  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || `Failed to update workflow: ${response.status}`)
  }
  return response.json() as Promise<Workflow>
}
