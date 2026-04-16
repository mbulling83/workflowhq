// src/pages/LandingPage.tsx
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-6">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">WorkflowHQ</h1>
      <p className="text-lg text-slate-600 max-w-md text-center">
        Manage your n8n workflows from anywhere. No local setup required.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/signup">Get started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/signin">Sign in</Link>
        </Button>
      </div>
    </div>
  )
}
