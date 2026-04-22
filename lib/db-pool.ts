// lib/db-pool.ts
import { Pool } from 'pg'

let pool: Pool | null = null

function sanitizeDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.delete('channel_binding')
    return parsed.toString()
  } catch {
    // Fallback for malformed URLs: safely remove the param and
    // repair dangling query separators.
    return url
      .replace(/([?&])channel_binding=[^&]*(&)?/g, (_m, sep: string, hasNext: string) => {
        if (sep === '?' && hasNext) return '?'
        if (sep === '&' && hasNext) return '&'
        return ''
      })
      .replace(/\?&/, '?')
      .replace(/&&/g, '&')
      .replace(/[?&]$/, '')
  }
}

export function getAppPool() {
  if (!pool) {
    const rawUrl = process.env.DATABASE_URL ?? ''
    if (!rawUrl.trim()) {
      throw new Error('DATABASE_URL is not set')
    }
    const connectionString = sanitizeDatabaseUrl(rawUrl)
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      query_timeout: 10000,
      statement_timeout: 10000,
    })
  }

  return {
    async query<T>(text: string, values?: unknown[]): Promise<{ rows: T[] }> {
      const result = await pool!.query(text, values ?? [])
      return { rows: result.rows as T[] }
    },
  }
}
