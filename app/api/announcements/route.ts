import { announcementsRouteHandler } from '../../../lib/server/announcements-handler'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function OPTIONS(req: Request) {
  return announcementsRouteHandler(req)
}

export async function GET(req: Request) {
  return announcementsRouteHandler(req)
}

export async function POST(req: Request) {
  return announcementsRouteHandler(req)
}
