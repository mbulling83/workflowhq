// lib/withApiErrorHandling.ts
import { logAppError } from './error-logging'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

function getPathname(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

export function withApiErrorHandling(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error'
      await logAppError({
        source: 'api',
        category: 'request_failure',
        route: getPathname(req.url),
        method: req.method,
        statusCode: 500,
        message,
        stack: err instanceof Error ? err.stack : undefined,
      })
      console.error('[api]', req.url, err)
      return Response.json(
        { error: message },
        { status: 500, headers: corsHeaders }
      )
    }
  }
}
