import { getAppPool } from './db-pool'
import { createGitHubIssue } from './github-issues'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type ErrorLogInput = {
  source: string
  category: string
  message: string
  stack?: string
  route?: string
  method?: string
  statusCode?: number
  userId?: string
  email?: string
  metadata?: JsonValue
}

export type AppErrorLog = {
  id: number
  created_at: string
  source: string
  category: string
  route: string | null
  method: string | null
  status_code: number | null
  user_id: string | null
  email: string | null
  error_message: string
  error_stack: string | null
}

let tableEnsured = false

function truncate(value: string | undefined, maxLength: number): string | null {
  if (!value) return null
  return value.length <= maxLength ? value : value.slice(0, maxLength)
}

async function ensureErrorLogsTable(): Promise<void> {
  if (tableEnsured) return

  const pool = getAppPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_error_logs (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      source TEXT NOT NULL,
      category TEXT NOT NULL,
      route TEXT,
      method TEXT,
      status_code INTEGER,
      user_id TEXT,
      email TEXT,
      error_message TEXT NOT NULL,
      error_stack TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `)

  await pool.query(
    'CREATE INDEX IF NOT EXISTS app_error_logs_created_at_idx ON app_error_logs (created_at DESC)'
  )
  await pool.query(
    'CREATE INDEX IF NOT EXISTS app_error_logs_category_created_at_idx ON app_error_logs (category, created_at DESC)'
  )

  tableEnsured = true
}

export async function logAppError(input: ErrorLogInput): Promise<void> {
  try {
    await ensureErrorLogsTable()
    const pool = getAppPool()
    await pool.query(
      `INSERT INTO app_error_logs
      (source, category, route, method, status_code, user_id, email, error_message, error_stack, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
      [
        truncate(input.source, 120) ?? 'unknown',
        truncate(input.category, 120) ?? 'unknown',
        truncate(input.route, 300),
        truncate(input.method, 16),
        input.statusCode ?? null,
        truncate(input.userId, 120),
        truncate(input.email, 320),
        truncate(input.message, 4000) ?? 'Unknown error',
        truncate(input.stack, 12000),
        JSON.stringify(input.metadata ?? {}),
      ]
    )
    void createGitHubIssue({
      title: `[Bug][${input.source}] ${input.message.slice(0, 90)}`,
      labels: ['bug', `source:${input.source}`],
      body: [
        'A runtime app error was captured.',
        '',
        `- Source: ${input.source}`,
        `- Category: ${input.category}`,
        `- Status code: ${input.statusCode ?? 'unknown'}`,
        `- Route: ${input.route ?? 'unknown'}`,
        `- Method: ${input.method ?? 'unknown'}`,
        `- User: ${input.email ?? input.userId ?? 'unknown'}`,
        '',
        '## Error message',
        '',
        input.message,
        '',
        input.stack
          ? ['## Stack', '', '```', input.stack.slice(0, 12000), '```'].join('\n')
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
    })
  } catch (loggingError) {
    // Avoid throwing from logging paths. We still emit a console signal.
    console.error('[error-logging] failed to persist app error', loggingError)
  }
}

export async function listAppErrors(options?: {
  limit?: number
  source?: string
}): Promise<AppErrorLog[]> {
  await ensureErrorLogsTable()
  const pool = getAppPool()
  const limit = Math.min(Math.max(options?.limit ?? 30, 1), 100)

  if (options?.source?.trim()) {
    const result = await pool.query<AppErrorLog>(
      `SELECT id, created_at, source, category, route, method, status_code, user_id, email, error_message, error_stack
       FROM app_error_logs
       WHERE source = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [options.source.trim(), limit]
    )
    return result.rows
  }

  const result = await pool.query<AppErrorLog>(
    `SELECT id, created_at, source, category, route, method, status_code, user_id, email, error_message, error_stack
     FROM app_error_logs
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  )
  return result.rows
}
