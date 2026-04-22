import connectionHandler from '../../../lib/server/connection-handler'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function OPTIONS(req: Request) {
  return connectionHandler(req)
}

export async function GET(req: Request) {
  return connectionHandler(req)
}

export async function POST(req: Request) {
  return connectionHandler(req)
}

export async function PUT(req: Request) {
  return connectionHandler(req)
}
