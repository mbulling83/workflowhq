'use client'

import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react/ui'
import { authClient } from '@/lib/auth'
import '@neondatabase/neon-js/ui/css'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <NeonAuthUIProvider authClient={authClient} redirectTo="/app">
      {children as any}
    </NeonAuthUIProvider>
  )
}
