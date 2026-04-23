'use client'

import { AuthGuard } from '@/components/AuthGuard'
import { AppProviders } from '@/components/AppProviders'
import { DashboardScreen } from '@/screens/DashboardScreen'

interface DashboardRouteClientProps {
  showBillingSection: boolean
}

export function DashboardRouteClient({ showBillingSection }: DashboardRouteClientProps) {
  return (
    <AppProviders>
      <AuthGuard>
        <DashboardScreen showBillingSection={showBillingSection} />
      </AuthGuard>
    </AppProviders>
  )
}
