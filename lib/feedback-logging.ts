import { getAppPool } from './db-pool'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type FeedbackCategory = 'feedback' | 'bug' | 'idea' | 'question'

export type FeedbackLogInput = {
  category: FeedbackCategory
  message: string
  pagePath?: string
  pageUrl?: string
  userId?: string
  email?: string
  usedVoiceInput?: boolean
  userAgent?: string
  metadata?: JsonValue
}

export type FeedbackSubmission = {
  id: number
  created_at: string
  category: FeedbackCategory
  message: string
  page_path: string | null
  page_url: string | null
  user_id: string | null
  email: string | null
  used_voice_input: boolean
}

let tableEnsured = false

function truncate(value: string | undefined, maxLength: number): string | null {
  if (!value) return null
  return value.length <= maxLength ? value : value.slice(0, maxLength)
}

async function ensureFeedbackTable(): Promise<void> {
  if (tableEnsured) return

  const pool = getAppPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_feedback_submissions (
      id BIGSERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      page_path TEXT,
      page_url TEXT,
      user_id TEXT,
      email TEXT,
      used_voice_input BOOLEAN NOT NULL DEFAULT false,
      user_agent TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `)

  await pool.query(
    'CREATE INDEX IF NOT EXISTS app_feedback_submissions_created_at_idx ON app_feedback_submissions (created_at DESC)'
  )
  await pool.query(
    'CREATE INDEX IF NOT EXISTS app_feedback_submissions_category_created_at_idx ON app_feedback_submissions (category, created_at DESC)'
  )

  tableEnsured = true
}

export async function logFeedback(input: FeedbackLogInput): Promise<void> {
  await ensureFeedbackTable()

  const pool = getAppPool()
  await pool.query(
    `INSERT INTO app_feedback_submissions
    (category, message, page_path, page_url, user_id, email, used_voice_input, user_agent, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
    [
      truncate(input.category, 30) ?? 'feedback',
      truncate(input.message, 6000) ?? '',
      truncate(input.pagePath, 500),
      truncate(input.pageUrl, 1500),
      truncate(input.userId, 120),
      truncate(input.email, 320),
      Boolean(input.usedVoiceInput),
      truncate(input.userAgent, 1000),
      JSON.stringify(input.metadata ?? {}),
    ]
  )
}

export async function listFeedback(options?: {
  limit?: number
  category?: FeedbackCategory
}): Promise<FeedbackSubmission[]> {
  await ensureFeedbackTable()

  const pool = getAppPool()
  const limit = Math.min(Math.max(options?.limit ?? 30, 1), 100)
  if (options?.category) {
    const result = await pool.query<FeedbackSubmission>(
      `SELECT id, created_at, category, message, page_path, page_url, user_id, email, used_voice_input
       FROM app_feedback_submissions
       WHERE category = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [options.category, limit]
    )
    return result.rows
  }

  const result = await pool.query<FeedbackSubmission>(
    `SELECT id, created_at, category, message, page_path, page_url, user_id, email, used_voice_input
     FROM app_feedback_submissions
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  )
  return result.rows
}
