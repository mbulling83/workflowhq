'use client'

import { AuthGuard } from '@/components/AuthGuard'
import { AppProviders } from '@/components/AppProviders'
import { SettingsScreen } from '@/screens/SettingsScreen'

export default function SettingsRoute() {
  return (
    <AppProviders>
      <AuthGuard>
        <SettingsScreen />
      </AuthGuard>
    </AppProviders>
  )
}
