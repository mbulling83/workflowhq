// src/components/TopNav.tsx
import { Link, useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth'
import { Button } from '@/components/ui/button'

interface TopNavProps {
  workflowCount?: number
}

export function TopNav({ workflowCount }: TopNavProps) {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate('/')
  }

  return (
    <header className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/app" className="text-lg font-semibold text-slate-900">
          WorkflowHQ
        </Link>
        {workflowCount !== undefined && (
          <span className="text-sm text-slate-500">
            {workflowCount} workflow{workflowCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/settings">Settings</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
