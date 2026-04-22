// src/lib/auth.ts
import { createAuthClient } from '@neondatabase/neon-js/auth'
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react'

const neonAuthUrl =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ??
  process.env.VITE_NEON_AUTH_URL ??
  ''

export const authClient = createAuthClient(neonAuthUrl, {
  adapter: BetterAuthReactAdapter(),
})
