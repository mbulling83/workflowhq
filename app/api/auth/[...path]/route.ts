import { createNeonAuth } from '@neondatabase/neon-js/auth/next/server'
import { logAppError } from '../../../../lib/error-logging'

type AuthMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
type NeonAuthHandlers = ReturnType<ReturnType<typeof createNeonAuth>['handler']>
type AuthRouteContext = Parameters<NeonAuthHandlers['GET']>[1]

const baseUrl = (
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ??
  process.env.VITE_NEON_AUTH_URL ??
  ''
).trim()

function getPathname(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

let neonAuthHandlers: NeonAuthHandlers | undefined
let authInitializationError: unknown

try {
  const auth = createNeonAuth({
    baseUrl,
    cookies: {
      secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    },
  })
  neonAuthHandlers = auth.handler()
} catch (err) {
  authInitializationError = err
  void logAppError({
    source: 'auth',
    category: 'auth_initialization',
    route: '/api/auth/[...path]',
    method: 'INIT',
    statusCode: 503,
    message: err instanceof Error ? err.message : 'Failed to initialize auth handler',
    stack: err instanceof Error ? err.stack : undefined,
    metadata: {
      hasAuthUrl: Boolean(baseUrl),
      hasCookieSecret: Boolean(process.env.NEON_AUTH_COOKIE_SECRET?.trim()),
    },
  })
  console.error('[auth] initialization failed', err)
}

async function runAuthHandler(req: Request, ctx: AuthRouteContext, method: AuthMethod) {
  if (authInitializationError || !neonAuthHandlers) {
    await logAppError({
      source: 'auth',
      category: 'auth_unavailable',
      route: getPathname(req.url),
      method,
      statusCode: 503,
      message:
        authInitializationError instanceof Error
          ? authInitializationError.message
          : 'Authentication service misconfigured',
      stack: authInitializationError instanceof Error ? authInitializationError.stack : undefined,
    })

    return Response.json(
      { error: 'Authentication service misconfigured. Please try again later.' },
      { status: 503 }
    )
  }

  const handler = neonAuthHandlers[method]
  try {
    return await handler(req, ctx)
  } catch (err) {
    await logAppError({
      source: 'auth',
      category: 'auth_request_failure',
      route: getPathname(req.url),
      method,
      statusCode: 500,
      message: err instanceof Error ? err.message : 'Auth handler failed',
      stack: err instanceof Error ? err.stack : undefined,
    })
    throw err
  }
}

export async function GET(req: Request, ctx: AuthRouteContext) {
  return runAuthHandler(req, ctx, 'GET')
}

export async function POST(req: Request, ctx: AuthRouteContext) {
  return runAuthHandler(req, ctx, 'POST')
}

export async function PUT(req: Request, ctx: AuthRouteContext) {
  return runAuthHandler(req, ctx, 'PUT')
}

export async function DELETE(req: Request, ctx: AuthRouteContext) {
  return runAuthHandler(req, ctx, 'DELETE')
}

export async function PATCH(req: Request, ctx: AuthRouteContext) {
  return runAuthHandler(req, ctx, 'PATCH')
}
