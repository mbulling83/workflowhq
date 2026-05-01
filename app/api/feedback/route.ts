import { getSessionUser } from '../../../lib/auth-helpers'
import { type FeedbackCategory, listFeedback, logFeedback } from '../../../lib/feedback-logging'
import { createGitHubIssue } from '../../../lib/github-issues'
import { withApiErrorHandling } from '../../../lib/withApiErrorHandling'

const ALLOWED_CATEGORIES: FeedbackCategory[] = ['feedback', 'bug', 'idea', 'question']

type FeedbackRequestBody = {
  category?: string
  message?: string
  pagePath?: string
  pageUrl?: string
  usedVoiceInput?: boolean
}

function parseAdminEmailAllowlist(): Set<string> {
  const raw = process.env.FEEDBACK_ADMIN_EMAILS ?? ''
  return new Set(
    raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  )
}

function isAllowedCategory(value: string): value is FeedbackCategory {
  return ALLOWED_CATEGORIES.includes(value as FeedbackCategory)
}

async function postFeedbackHandler(req: Request): Promise<Response> {
  const body = (await req.json()) as FeedbackRequestBody
  const message = body.message?.trim() ?? ''
  const rawCategory = body.category?.trim() ?? 'feedback'
  if (!isAllowedCategory(rawCategory)) {
    return Response.json({ error: 'Invalid category' }, { status: 400 })
  }
  const category = rawCategory

  if (!message) {
    return Response.json({ error: 'Message is required' }, { status: 400 })
  }

  const user = await getSessionUser(req).catch(() => null)
  await logFeedback({
    category,
    message,
    pagePath: typeof body.pagePath === 'string' ? body.pagePath : undefined,
    pageUrl: typeof body.pageUrl === 'string' ? body.pageUrl : undefined,
    usedVoiceInput: Boolean(body.usedVoiceInput),
    userAgent: req.headers.get('user-agent') ?? undefined,
    userId: user?.id,
    email: user?.email,
  })
  void createGitHubIssue({
    title: `[Feedback][${category}] ${message.slice(0, 80)}`,
    labels: ['feedback', category],
    body: [
      'A new feedback submission was received.',
      '',
      `- Category: ${category}`,
      `- User: ${user?.email ?? 'anonymous'}`,
      `- Page path: ${typeof body.pagePath === 'string' ? body.pagePath : 'unknown'}`,
      `- Page URL: ${typeof body.pageUrl === 'string' ? body.pageUrl : 'unknown'}`,
      `- Used voice input: ${body.usedVoiceInput ? 'yes' : 'no'}`,
      '',
      '## Message',
      '',
      message,
    ].join('\n'),
  })

  return Response.json({ ok: true })
}

async function getFeedbackHandler(req: Request): Promise<Response> {
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
  const rawCategory = (url.searchParams.get('category') ?? '').trim().toLowerCase()
  const category = isAllowedCategory(rawCategory) ? rawCategory : undefined
  const rows = await listFeedback({ limit: Number.isFinite(limitParam) ? limitParam : 30, category })

  return Response.json({ data: rows })
}

export const runtime = 'nodejs'
export const maxDuration = 30

export const POST = withApiErrorHandling(postFeedbackHandler)
export const GET = withApiErrorHandling(getFeedbackHandler)
