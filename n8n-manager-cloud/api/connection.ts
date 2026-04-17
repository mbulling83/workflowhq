// api/connection.ts
import { Pool } from 'pg'
import { attachDatabasePool } from '@vercel/functions'
import { encrypt } from '../lib/encryption'
import { getSessionUser } from '../lib/auth-helpers'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
attachDatabasePool(pool)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const user = await getSessionUser(req)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  if (req.method === 'GET') {
    const result = await pool.query(
      'SELECT id, n8n_url, verified FROM user_connections WHERE user_id = $1',
      [user.id]
    )
    return Response.json(result.rows[0] ?? null, { headers: corsHeaders })
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const { n8nUrl, apiKey } = await req.json()
    if (!n8nUrl || !apiKey) {
      return Response.json({ error: 'n8nUrl and apiKey required' }, { status: 400, headers: corsHeaders })
    }
    const encrypted = encrypt(apiKey)
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
