import { announcementsSeenRouteHandler } from '../../../../lib/server/announcements-handler'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function OPTIONS(req: Request) {
  return announcementsSeenRouteHandler(req)
}

export async function POST(req: Request) {
  return announcementsSeenRouteHandler(req)
}
