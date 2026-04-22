// lib/auth-helpers.ts
import { getAppPool } from './db-pool'

export interface SessionUser {
  id: string
  email: string
}

// Accepts both Web API Request (headers.get) and Vercel Node.js IncomingMessage (headers object)
export async function getSessionUser(req: { headers: unknown }): Promise<SessionUser | null> {
  const headers = req.headers as Record<string, string | string[] | undefined> & {
    get?: (name: string) => string | null
  }

  let authHeader: string | null = null
  if (typeof headers.get === 'function') {
    authHeader = headers.get('authorization')
  } else {
    const h = headers['authorization']
    authHeader = Array.isArray(h) ? (h[0] ?? null) : (h ?? null)
  }

  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const result = await getAppPool().query<SessionUser>(
    `SELECT u.id, u.email
     FROM neon_auth.session s
     JOIN neon_auth."user" u ON s."userId" = u.id
     WHERE s.token::text = $1 AND s."expiresAt" > NOW()`,
    [token]
  )
  return result.rows[0] ?? null
}

// Parses JSON body from Web API Request or legacy Node-style `{ body }` (pre-parsed).
export async function parseJsonBody<T>(req: Request | { json?: () => Promise<T>; body?: T }): Promise<T> {
  if (typeof Request !== 'undefined' && req instanceof Request) {
    return req.json() as Promise<T>
  }
  const legacy = req as { json?: () => Promise<T>; body?: T }
  if (typeof legacy.json === 'function') {
    return legacy.json()
  }
  return legacy.body as T
}
