import { getSessionUser, parseJsonBody } from '../auth-helpers'
import { getAppPool } from '../db-pool'
import { withApiErrorHandling } from '../withApiErrorHandling'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

interface AnnouncementRow {
  id: number | string
  title: string
  message: string
  cta_label: string | null
  cta_url: string | null
  created_at: string
  has_seen: boolean
}

interface CreateAnnouncementBody {
  title: string
  message: string
  ctaLabel?: string
  ctaUrl?: string
}

interface MarkSeenBody {
  announcementId: number | string
}

async function ensureAnnouncementTables() {
  const pool = getAppPool()
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feature_announcements (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      cta_label TEXT,
      cta_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feature_announcement_views (
      announcement_id BIGINT NOT NULL REFERENCES feature_announcements(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL,
      seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (announcement_id, user_id)
    )
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_feature_announcements_active_created
      ON feature_announcements (created_at DESC)
      WHERE is_active = true
  `)
}

async function announcementsHandler(req: Request): Promise<Response> {
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

  await ensureAnnouncementTables()
  const pool = getAppPool()

  if (req.method === 'GET') {
    const result = await pool.query<AnnouncementRow>(
      `SELECT
         fa.id,
         fa.title,
         fa.message,
         fa.cta_label,
         fa.cta_url,
         fa.created_at::text,
         (fav.user_id IS NOT NULL) AS has_seen
       FROM feature_announcements fa
       LEFT JOIN feature_announcement_views fav
         ON fav.announcement_id = fa.id
        AND fav.user_id = $1
       WHERE fa.is_active = true
       ORDER BY fa.created_at DESC
       LIMIT 1`,
      [user.id]
    )

    const announcement = result.rows[0] ?? null
    return Response.json(
      {
        announcement: announcement
          ? {
              id: announcement.id,
              title: announcement.title,
              message: announcement.message,
              ctaLabel: announcement.cta_label,
              ctaUrl: announcement.cta_url,
              createdAt: announcement.created_at,
            }
          : null,
        hasSeen: announcement?.has_seen ?? false,
      },
      { headers: corsHeaders }
    )
  }

  if (req.method === 'POST') {
    const { title, message, ctaLabel, ctaUrl } = await parseJsonBody<CreateAnnouncementBody>(req)

    if (!title?.trim() || !message?.trim()) {
      return Response.json(
        { error: 'title and message are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    await pool.query(
      `INSERT INTO feature_announcements (title, message, cta_label, cta_url, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [title.trim(), message.trim(), ctaLabel?.trim() || null, ctaUrl?.trim() || null, user.id]
    )

    return Response.json({ ok: true }, { headers: corsHeaders })
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
}

async function announcementsSeenHandler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const user = await getSessionUser(req)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  await ensureAnnouncementTables()
  const pool = getAppPool()

  if (req.method === 'POST') {
    const { announcementId } = await parseJsonBody<MarkSeenBody>(req)
    const parsedAnnouncementId = Number.parseInt(String(announcementId), 10)
    if (!Number.isInteger(parsedAnnouncementId) || parsedAnnouncementId <= 0) {
      return Response.json({ error: 'announcementId must be an integer' }, { status: 400, headers: corsHeaders })
    }

    await pool.query(
      `INSERT INTO feature_announcement_views (announcement_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (announcement_id, user_id) DO UPDATE
       SET seen_at = NOW()`,
      [parsedAnnouncementId, user.id]
    )
    return Response.json({ ok: true }, { headers: corsHeaders })
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders })
}

export const announcementsRouteHandler = withApiErrorHandling(announcementsHandler)
export const announcementsSeenRouteHandler = withApiErrorHandling(announcementsSeenHandler)
