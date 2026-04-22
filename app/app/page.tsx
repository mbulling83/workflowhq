'use client'

import { AuthGuard } from '@/components/AuthGuard'
import { AppProviders } from '@/components/AppProviders'
import { DashboardScreen } from '@/screens/DashboardScreen'

export default function DashboardRoute() {
  return (
    <AppProviders>
      <AuthGuard>
        <DashboardScreen />
      </AuthGuard>
    </AppProviders>
  )
}
