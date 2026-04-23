import { getSessionUser } from '../../../lib/auth-helpers'
import { listAppErrors } from '../../../lib/error-logging'
import { withApiErrorHandling } from '../../../lib/withApiErrorHandling'

function parseAdminEmailAllowlist(): Set<string> {
  const raw = process.env.FEEDBACK_ADMIN_EMAILS ?? ''
  return new Set(
    raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  )
}

async function getErrorsHandler(req: Request): Promise<Response> {
  const user = await getSessionUser(req)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowlist = parseAdminEmailAllowlist()
  if (!allowlist.size || !allowlist.has(user.email.toLowerCase())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const limitParam = Number(url.searchParams.get('limit') ?? 30)
  const source = (url.searchParams.get('source') ?? '').trim()
  const rows = await listAppErrors({
    limit: Number.isFinite(limitParam) ? limitParam : 30,
    source: source || undefined,
  })

  return Response.json({ data: rows })
}

export const runtime = 'nodejs'
export const maxDuration = 30

export const GET = withApiErrorHandling(getErrorsHandler)
