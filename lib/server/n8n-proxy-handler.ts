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

function friendlyN8nError(err: N8nHttpError): { httpStatus: number; message: string } {
  switch (true) {
    case err.status === 401:
      return { httpStatus: 400, message: 'Your n8n API key is invalid or has been revoked. Go to Settings → n8n Connection to update it.' }
    case err.status === 403:
      return { httpStatus: 400, message: 'Your n8n API key doesn\'t have permission to read workflows. Check the key scopes in your n8n instance.' }
    case err.status === 404:
      return { httpStatus: 400, message: 'Your n8n instance URL appears to be incorrect or unreachable. Double-check it in Settings.' }
    case err.status === 429:
      return { httpStatus: 429, message: 'n8n is rate-limiting requests right now. Please wait a moment and try again.' }
    case err.status >= 500:
      return { httpStatus: 502, message: 'Your n8n instance returned a server error and may be temporarily unavailable. Try again in a moment.' }
    default:
      return { httpStatus: 502, message: `Unexpected response from n8n (status ${err.status}). Please try again.` }
  }
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
      if (!/^[a-zA-Z0-9_-]+$/.test(body.workflowId)) return Response.json({ error: 'Invalid workflowId' }, { status: 400, headers: withTraceHeaders(corsHeaders) })
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
    if (err instanceof N8nHttpError) {
      const { httpStatus, message } = friendlyN8nError(err)
      return Response.json({ error: message }, { status: httpStatus, headers: withTraceHeaders(corsHeaders) })
    }
    const message = err instanceof Error
      ? (err.name === 'AbortError'
          ? 'Could not reach your n8n instance — it may be offline or the URL is incorrect.'
          : err.message)
      : 'An unexpected error occurred. Please try again.'
    return Response.json({ error: message }, { status: 500, headers: withTraceHeaders(corsHeaders) })
  }
}

export default withApiErrorHandling(n8nProxyHandler)
