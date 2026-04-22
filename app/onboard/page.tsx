'use client'

import { AuthGuard } from '@/components/AuthGuard'
import { AppProviders } from '@/components/AppProviders'
import { OnboardingScreen } from '@/screens/OnboardingScreen'

export default function OnboardRoute() {
  return (
    <AppProviders>
      <AuthGuard>
        <OnboardingScreen />
      </AuthGuard>
    </AppProviders>
  )
}
