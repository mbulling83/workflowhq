'use client'

import { AuthView } from '@neondatabase/neon-js/auth/react/ui'
import { AppProviders } from '@/components/AppProviders'

export default async function AuthPathPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params
  return (
    <AppProviders>
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <AuthView path={path} />
      </div>
    </AppProviders>
  )
}
