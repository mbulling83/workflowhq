// src/hooks/useAuth.ts
import { authClient } from '../lib/auth'

export function useAuth() {
  const { data: session, isPending: loading } = authClient.useSession()
  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    loading,
    token: session?.session?.token ?? null,
  }
}
