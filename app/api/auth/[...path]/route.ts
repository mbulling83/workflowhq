import { createNeonAuth } from '@neondatabase/neon-js/auth/next/server'

const baseUrl = (
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ??
  process.env.VITE_NEON_AUTH_URL ??
  ''
).trim()

const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
})

export const { GET, POST, PUT, DELETE, PATCH } = auth.handler()
