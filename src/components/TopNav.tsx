// src/components/TopNav.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '../lib/auth'
import { Button } from '@/components/ui/button'

interface TopNavProps {
  workflowCount?: number
  onSettingsClick?: () => void
}

export function TopNav({ workflowCount, onSettingsClick }: TopNavProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/')
  }

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/app" className="text-lg font-semibold text-slate-900">
          WorkflowHQ
        </Link>
        {workflowCount !== undefined && (
          <span className="text-sm text-slate-500">
            {workflowCount} workflow{workflowCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onSettingsClick}>
          Settings
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
