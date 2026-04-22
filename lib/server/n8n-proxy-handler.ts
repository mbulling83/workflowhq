import { decrypt } from '../encryption'
import { parseJsonBody } from '../auth-helpers'
import { getAppPool } from '../db-pool'
import { createN8nWorkflowClient, N8nHttpError } from '../n8n-workflows'
import { withApiErrorHandling } from '../withApiErrorHandling'

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

const N8N_FETCH_TIMEOUT_MS = Number(process.env.N8N_FETCH_TIMEOUT_MS ?? 20000)
const N8N_LIST_PAGE_SIZE = Number(process.env.N8N_LIST_PAGE_SIZE ?? 100)
const MAX_LIST_PAGES = Number(process.env.N8N_MAX_LIST_PAGES ?? 200)
const N8N_FETCH_MAX_ATTEMPTS = Number(process.env.N8N_FETCH_MAX_ATTEMPTS ?? 2)
const N8N_PROXY_BUDGET_MS = Number(process.env.N8N_PROXY_BUDGET_MS ?? 25000)
const TRACE_PROXY = process.env.N8N_PROXY_TRACE === '1'

function mkReqId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function extractToken(req: Request): string | null {
  const h = req.headers as unknown as { get?: (k: string) => string | null } & Record<string, string | string[] | undefined>
  const raw = typeof h.get === 'function' ? h.get('authorization') : (Array.isArray(h['authorization']) ? h['authorization'][0] : h['authorization']) ?? null
  return raw?.startsWith('Bearer ') ? raw.slice(7) : null
}

async function n8nProxyHandler(req: Request): Promise<Response> {
  const reqId = mkReqId()
  const t0 = Date.now()
  const deadlineAt = t0 + N8N_PROXY_BUDGET_MS
  const log = (msg: string) => {
    if (!TRACE_PROXY) return
    console.log(`[proxy:${reqId}] ${msg} (+${Date.now() - t0}ms)`)
  }
  const withTraceHeaders = (headers: Record<string, string>) => ({
    ...headers,
    'x-proxy-trace-id': reqId,
  })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: withTraceHeaders(corsHeaders) })
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: withTraceHeaders(corsHeaders) })
  if (!process.env.DATABASE_URL?.trim()) return Response.json({ error: 'Server misconfiguration: DATABASE_URL is not set' }, { status: 503, headers: withTraceHeaders(corsHeaders) })

  const token = extractToken(req)
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: withTraceHeaders(corsHeaders) })

  const [body, dbRow] = await Promise.all([
    parseJsonBody<ProxyRequest>(req),
    getAppPool().query<{ user_id: string; email: string; n8n_url: string | null; api_key_encrypted: string | null }>(
      `SELECT u.id AS user_id, u.email, uc.n8n_url, uc.api_key_encrypted
       FROM neon_auth.session s
       JOIN neon_auth."user" u ON s."userId" = u.id
       LEFT JOIN user_connections uc ON uc.user_id = u.id::text
       WHERE s.token::text = $1 AND s."expiresAt" > NOW()`,
      [token]
    ),
  ])

  if (!dbRow.rows[0]) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: withTraceHeaders(corsHeaders) })
  const { n8n_url, api_key_encrypted } = dbRow.rows[0]

  let n8nUrl: string
  let apiKey: string
  if (body.action === 'verify') {
    if (!body.n8nUrl || !body.apiKey) return Response.json({ error: 'n8nUrl and apiKey required' }, { status: 400, headers: withTraceHeaders(corsHeaders) })
    n8nUrl = body.n8nUrl
    apiKey = body.apiKey
  } else {
    if (!n8n_url || !api_key_encrypted) return Response.json({ error: 'No connection configured' }, { status: 404, headers: withTraceHeaders(corsHeaders) })
    n8nUrl = n8n_url
    apiKey = decrypt(api_key_encrypted)
  }

  const workflowClient = createN8nWorkflowClient({
    n8nUrl,
    apiKey,
    timeoutMs: N8N_FETCH_TIMEOUT_MS,
    budgetMs: N8N_PROXY_BUDGET_MS,
    maxAttempts: N8N_FETCH_MAX_ATTEMPTS,
    trace: (message) => log(message),
  })

  try {
    if (body.action === 'verify') {
      await workflowClient.verifyConnection()
      return Response.json({ ok: true }, { headers: withTraceHeaders(corsHeaders) })
    }
    if (body.action === 'list') {
      const workflows = await workflowClient.listWorkflows({ verifyOnly: false, pageSize: N8N_LIST_PAGE_SIZE, maxPages: MAX_LIST_PAGES, excludePinnedData: true })
      return Response.json({ data: workflows }, { headers: withTraceHeaders(corsHeaders) })
    }
    if (body.action === 'update') {
      if (!body.workflowId || !body.payload) return Response.json({ error: 'workflowId and payload required' }, { status: 400, headers: withTraceHeaders(corsHeaders) })
      const patchUrl = `${workflowClient.workflowsUrl}/${body.workflowId}`
      const remainingMs = deadlineAt - Date.now()
      if (remainingMs <= 500) throw new Error(`Proxy time budget exhausted (${N8N_PROXY_BUDGET_MS}ms)`)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), Math.max(1000, Math.min(N8N_FETCH_TIMEOUT_MS, remainingMs - 250)))
      let res: Response
      try {
        res = await fetch(patchUrl, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': apiKey }, body: JSON.stringify(body.payload), signal: controller.signal })
      } finally {
        clearTimeout(timer)
      }
      const raw = await res.text()
      let result: unknown
      try {
        result = raw ? JSON.parse(raw) : null
      } catch {
        return Response.json({ error: `n8n returned ${res.status} with a non-JSON body${raw ? `: ${raw.slice(0, 200)}` : ''}` }, { status: res.status || 502, headers: withTraceHeaders(corsHeaders) })
      }
      return Response.json(result, { status: res.status, headers: withTraceHeaders(corsHeaders) })
    }
    return Response.json({ error: 'Unknown action' }, { status: 400, headers: withTraceHeaders(corsHeaders) })
  } catch (err) {
    if (err instanceof N8nHttpError) return Response.json({ error: err.message }, { status: err.status, headers: withTraceHeaders(corsHeaders) })
    const message = err instanceof Error ? (err.name === 'AbortError' ? `Connection timed out after ${N8N_FETCH_TIMEOUT_MS}ms — check the n8n URL/network reachability` : err.message) : 'Internal error'
    return Response.json({ error: message }, { status: 500, headers: withTraceHeaders(corsHeaders) })
  }
}

export default withApiErrorHandling(n8nProxyHandler)
