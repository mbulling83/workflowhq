// src/pages/DashboardPage.tsx
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkflowList } from '@n8n/ui'
import type { Workflow } from '@n8n/ui'
import { fetchWorkflows, updateWorkflow } from '../services/n8nProxy'
import { useConnection } from '../hooks/useConnection'
import { TopNav } from '../components/TopNav'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

const LOADING_MESSAGES = [
  'Fetching your workflows…',
  'Polling the automation gods…',
  'Waking up your cron jobs…',
  'Asking n8n nicely…',
  'Counting webhooks…',
]

export function DashboardPage() {
  const navigate = useNavigate()
  const { connection, loading: connectionLoading } = useConnection()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msgIndex, setMsgIndex] = useState(0)

  // Rotate loading message
  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length), 2500)
    return () => clearInterval(t)
  }, [loading])

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchWorkflows()
      setWorkflows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (connectionLoading) return

    if (!connection || !connection.verified) {
      navigate('/onboard')
      return
    }

    loadWorkflows()
  }, [connection, connectionLoading, navigate, loadWorkflows])

  if (connectionLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="flex gap-1 justify-center">
              <span className="animate-bounce delay-0 w-2 h-2 bg-slate-400 rounded-full" />
              <span className="animate-bounce delay-150 w-2 h-2 bg-slate-400 rounded-full" />
              <span className="animate-bounce delay-300 w-2 h-2 bg-slate-400 rounded-full" />
            </div>
            <p className="text-slate-500 text-sm">{LOADING_MESSAGES[msgIndex]}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={loadWorkflows} className="flex-1">Retry</Button>
              <Button variant="outline" onClick={() => navigate('/settings')}>
                Update credentials
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopNav workflowCount={workflows.length} />
      <main className="flex-1 p-6">
        <WorkflowList
          workflows={workflows}
          onWorkflowUpdate={loadWorkflows}
          updateWorkflow={updateWorkflow}
        />
      </main>
    </div>
  )
}
