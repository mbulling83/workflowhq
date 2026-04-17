// lib/auth-helpers.ts
import { Pool } from 'pg'

// Lazily-initialised pool for auth queries (created once per cold start)
let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL })
  return _pool
}

export interface SessionUser {
  id: string
  email: string
}

export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const result = await getPool().query<SessionUser>(
    `SELECT u.id, u.email
     FROM neon_auth.session s
     JOIN neon_auth."user" u ON s.user_id = u.id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  )
  return result.rows[0] ?? null
}
