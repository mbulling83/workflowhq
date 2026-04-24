import { encrypt } from '../encryption'
import { getSessionUser, parseJsonBody } from '../auth-helpers'
import { getAppPool } from '../db-pool'
import { withApiErrorHandling } from '../withApiErrorHandling'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

async function connectionHandler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return Response.json(
      { error: 'Server misconfiguration: DATABASE_URL is not set' },
      { status: 503, headers: corsHeaders }
    )
  }

  const user = await getSessionUser(req)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  const pool = getAppPool()

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT id, n8n_url, verified FROM user_connections WHERE user_id = $1',
        [user.id]
      )
      return Response.json(result.rows[0] ?? null, { headers: corsHeaders })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Database error'
      return Response.json({ error: msg }, { status: 500, headers: corsHeaders })
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const { n8nUrl, apiKey } = await parseJsonBody<{ n8nUrl: string; apiKey: string }>(req)
    if (!n8nUrl || !apiKey) {
      return Response.json({ error: 'n8nUrl and apiKey required' }, { status: 400, headers: corsHeaders })
    }
    let encrypted: string
    try {
      encrypted = encrypt(apiKey)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Encryption failed'
      return Response.json(
        { error: msg.includes('ENCRYPTION_KEY') ? 'Server misconfiguration: ENCRYPTION_KEY' : msg },
        { status: 503, headers: corsHeaders }
      )
    }
    await pool.query(
      `INSERT INTO user_connections (user_id, n8n_url, api_key_encrypted, verified)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (user_id) DO UPDATE
       SET n8n_url = $2, api_key_encrypted = $3, verified = true, updated_at = now()`,
      [user.id, n8nUrl, encrypted]
    )
    return Response.json({ ok: true }, { headers: corsHeaders })
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
}

export default withApiErrorHandling(connectionHandler)
