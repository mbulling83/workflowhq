import n8nProxyHandler from '../../../lib/server/n8n-proxy-handler'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function OPTIONS(req: Request) {
  return n8nProxyHandler(req)
}

export async function GET(req: Request) {
  return n8nProxyHandler(req)
}

export async function POST(req: Request) {
  return n8nProxyHandler(req)
}
