// lib/withApiErrorHandling.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

export function withApiErrorHandling(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error'
      console.error('[api]', req.url, err)
      return Response.json(
        { error: message },
        { status: 500, headers: corsHeaders }
      )
    }
  }
}
