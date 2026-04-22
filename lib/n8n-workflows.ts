type TraceFn = (message: string) => void

export interface N8nWorkflowClientOptions {
  n8nUrl: string
  apiKey: string
  timeoutMs: number
  budgetMs: number
  maxAttempts: number
  trace?: TraceFn
}

export interface N8nListOptions {
  verifyOnly: boolean
  pageSize: number
  maxPages: number
  excludePinnedData?: boolean
}

export class N8nHttpError extends Error {
  status: number
  body: string

  constructor(status: number, body: string) {
    super(`n8n returned ${status}: ${body}`)
    this.status = status
    this.body = body
  }
}

function normalizeWorkflowsUrl(n8nUrl: string): string {
  const baseUrl = n8nUrl.trim().replace(/\/$/, '')
  return baseUrl.includes('/api/v1/workflows')
    ? baseUrl
    : `${baseUrl}/api/v1/workflows`
}

function getRetryDelayMs(attempt: number): number {
  return 250 * 2 ** (attempt - 1)
}

export function createN8nWorkflowClient(options: N8nWorkflowClientOptions) {
  const workflowsUrl = normalizeWorkflowsUrl(options.n8nUrl)
  const headers = {
    'Content-Type': 'application/json',
    'X-N8N-API-KEY': options.apiKey,
  }
  const startedAt = Date.now()
  const deadlineAt = startedAt + options.budgetMs

  const trace = (message: string) => {
    options.trace?.(message)
  }

  const fetchWithRetry = async (url: string, init?: RequestInit): Promise<Response> => {
    const maxAttempts = Math.max(1, options.maxAttempts)
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const remainingMs = deadlineAt - Date.now()
      if (remainingMs <= 500) {
        throw new Error(`Proxy time budget exhausted (${options.budgetMs}ms)`)
      }
      const requestTimeoutMs = Math.max(1000, Math.min(options.timeoutMs, remainingMs - 250))
      trace(`n8n fetch start attempt=${attempt} timeout=${requestTimeoutMs}ms`)

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), requestTimeoutMs)
      try {
        const res = await fetch(url, {
          ...init,
          headers,
          signal: controller.signal,
        })
        const shouldRetry = res.status === 429 || res.status >= 500
        if (!shouldRetry || attempt === maxAttempts) {
          trace(`n8n fetch end attempt=${attempt} status=${res.status}`)
          return res
        }
      } catch (error) {
        const isAbort = error instanceof Error && error.name === 'AbortError'
        if (!isAbort || attempt === maxAttempts) {
          throw error
        }
        trace(`n8n fetch retrying after abort attempt=${attempt}`)
      } finally {
        clearTimeout(timer)
      }

      const delayMs = getRetryDelayMs(attempt)
      if (Date.now() + delayMs >= deadlineAt) {
        throw new Error(`Proxy time budget exhausted (${options.budgetMs}ms)`)
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
    throw new Error('Unexpected n8n retry state')
  }

  const parseJsonBody = async <T>(res: Response): Promise<T> => {
    const text = await res.text()
    if (!text.trim()) return {} as T
    try {
      return JSON.parse(text) as T
    } catch {
      throw new Error('n8n returned a non-JSON response — use the n8n base URL (e.g. https://your-n8n.com), not a workflow page URL')
    }
  }

  return {
    workflowsUrl,
    async verifyConnection(): Promise<void> {
      const params = new URLSearchParams({ limit: '1', excludePinnedData: 'true' })
      const res = await fetchWithRetry(`${workflowsUrl}?${params.toString()}`)
      if (!res.ok) {
        throw new N8nHttpError(res.status, await res.text())
      }
      await parseJsonBody<Record<string, unknown>>(res)
    },
    async listWorkflows(listOptions: N8nListOptions): Promise<unknown[]> {
      if (listOptions.verifyOnly) {
        await this.verifyConnection()
        return []
      }

      const allWorkflows: unknown[] = []
      let cursor: string | undefined
      const seenCursors = new Set<string>()

      for (let pageNumber = 1; pageNumber <= listOptions.maxPages; pageNumber += 1) {
        const params = new URLSearchParams({
          limit: String(listOptions.pageSize),
          excludePinnedData: String(listOptions.excludePinnedData ?? true),
        })
        if (cursor) {
          if (seenCursors.has(cursor)) {
            throw new Error('n8n pagination returned a duplicate cursor; aborting to avoid an infinite loop')
          }
          seenCursors.add(cursor)
          params.set('cursor', cursor)
        }

        trace(`list page=${pageNumber} cursor=${cursor ?? 'start'}`)
        const res = await fetchWithRetry(`${workflowsUrl}?${params.toString()}`)
        if (!res.ok) {
          throw new N8nHttpError(res.status, await res.text())
        }

        const page = await parseJsonBody<{
          data?: unknown[]
          nextCursor?: unknown
          next_cursor?: unknown
          cursor?: unknown
        }>(res)

        const items = (page.data ?? []).map((workflow: any) => {
          const { pinData: _pinData, ...rest } = workflow
          return rest
        })
        allWorkflows.push(...items)

        const rawCursor = page.nextCursor ?? page.next_cursor ?? page.cursor
        cursor = rawCursor == null ? undefined : String(rawCursor)
        if (!cursor) {
          trace(`list complete pages=${pageNumber} workflows=${allWorkflows.length}`)
          return allWorkflows
        }
      }

      throw new Error(`Workflow sync aborted after ${listOptions.maxPages} pages. Please retry or increase N8N_MAX_LIST_PAGES.`)
    },
  }
}
