// api/n8n-proxy.ts
import { Pool } from 'pg'
import { attachDatabasePool } from '@vercel/functions'
import { decrypt } from '../lib/encryption.js'
import { getSessionUser } from '../lib/auth-helpers.js'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
attachDatabasePool(pool)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

interface ProxyRequest {
  action: 'verify' | 'list' | 'update'
  n8nUrl?: string
  apiKey?: string
  workflowId?: string
  payload?: Record<string, unknown>
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const user = await getSessionUser(req)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  const body: ProxyRequest = await req.json()

  let n8nUrl: string
  let apiKey: string

  if (body.action === 'verify') {
    if (!body.n8nUrl || !body.apiKey) {
      return Response.json({ error: 'n8nUrl and apiKey required' }, { status: 400, headers: corsHeaders })
    }
    n8nUrl = body.n8nUrl
    apiKey = body.apiKey
  } else {
    const result = await pool.query(
      'SELECT n8n_url, api_key_encrypted FROM user_connections WHERE user_id = $1',
      [user.id]
    )
    if (!result.rows[0]) {
      return Response.json({ error: 'No connection configured' }, { status: 404, headers: corsHeaders })
    }
    n8nUrl = result.rows[0].n8n_url
    apiKey = decrypt(result.rows[0].api_key_encrypted)
  }

  const baseUrl = n8nUrl.replace(/\/$/, '')
  const workflowsUrl = baseUrl.includes('/api/v1/workflows')
    ? baseUrl
    : `${baseUrl}/api/v1/workflows`

  const n8nHeaders = {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': apiKey,
  }

  try {
    if (body.action === 'verify' || body.action === 'list') {
      const limit = body.action === 'verify' ? '1' : '250'
      const allWorkflows: unknown[] = []
      let cursor: string | undefined

      do {
        const params = new URLSearchParams({ limit })
        if (cursor) params.set('cursor', cursor)
        const res = await fetch(`${workflowsUrl}?${params}`, { headers: n8nHeaders })
        if (!res.ok) {
          const text = await res.text()
          return Response.json(
            { error: `n8n returned ${res.status}: ${text}` },
            { status: res.status, headers: corsHeaders }
          )
        }
        const page = await res.json()
        if (body.action === 'verify') {
          return Response.json({ ok: true }, { headers: corsHeaders })
        }
        allWorkflows.push(...(page.data ?? []))
        cursor = page.nextCursor
      } while (cursor)

      return Response.json({ data: allWorkflows }, { headers: corsHeaders })
    }

    if (body.action === 'update') {
      if (!body.workflowId || !body.payload) {
        return Response.json({ error: 'workflowId and payload required' }, { status: 400, headers: corsHeaders })
      }
      const res = await fetch(`${workflowsUrl}/${body.workflowId}`, {
        method: 'PATCH',
        headers: n8nHeaders,
        body: JSON.stringify(body.payload),
      })
      const result = await res.json()
      return Response.json(result, { status: res.status, headers: corsHeaders })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400, headers: corsHeaders })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error'
    return Response.json({ error: message }, { status: 500, headers: corsHeaders })
  }
}
