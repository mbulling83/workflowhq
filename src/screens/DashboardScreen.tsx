import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkflowList } from '@n8n/ui'
import type { Workflow } from '@n8n/ui'
import { fetchWorkflows, updateWorkflow, NoConnectionError } from '../services/n8nProxy'
import { useConnection } from '../hooks/useConnection'
import { TopNav } from '../components/TopNav'
import { Sheet } from '@/components/ui/sheet'
import { SettingsScreen } from './SettingsScreen'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchLatestAnnouncement,
  markAnnouncementSeen,
  type FeatureAnnouncement,
} from '@/services/announcements'

const LOADING_MESSAGES = [
  'Fetching your workflows…',
  'Polling the automation gods…',
  'Waking up your cron jobs…',
  'Asking n8n nicely…',
  'Counting webhooks…',
]

interface DashboardScreenProps {
  showBillingSection?: boolean
}

export function DashboardScreen({ showBillingSection = true }: DashboardScreenProps = {}) {
  const router = useRouter()
  const { token } = useAuth()
  const { connection } = useConnection()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [msgIndex, setMsgIndex] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [announcement, setAnnouncement] = useState<FeatureAnnouncement | null>(null)
  const [announcementLoading, setAnnouncementLoading] = useState(false)

  useEffect(() => {
    if (!loading) return
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length), 2500)
    return () => clearInterval(t)
  }, [loading])

  const loadWorkflows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchWorkflows()
      setWorkflows(data)
    } catch (err) {
      if (err instanceof NoConnectionError) {
        router.push('/onboard')
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to load workflows')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadWorkflows()
  }, [loadWorkflows])

  useEffect(() => {
    if (!token) return
    let cancelled = false

    const loadAnnouncement = async () => {
      try {
        const latest = await fetchLatestAnnouncement(token)
        if (!cancelled && latest.announcement && !latest.hasSeen) {
          setAnnouncement(latest.announcement)
        }
      } catch {
        // Announcements are non-blocking for dashboard rendering.
      }
    }

    loadAnnouncement()
    return () => {
      cancelled = true
    }
  }, [token])

  const dismissAnnouncement = useCallback(async () => {
    if (!announcement || !token) {
      return
    }
    setAnnouncementLoading(true)
    try {
      await markAnnouncementSeen(token, announcement.id)
      setAnnouncement(null)
    } finally {
      setAnnouncementLoading(false)
    }
  }, [announcement, token])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav onSettingsClick={() => setSettingsOpen(true)} />
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
        <TopNav onSettingsClick={() => setSettingsOpen(true)} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={loadWorkflows} className="flex-1">Retry</Button>
              <Button variant="outline" onClick={() => setSettingsOpen(true)}>
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
      <TopNav workflowCount={workflows.length} onSettingsClick={() => setSettingsOpen(true)} />
      <main className="flex-1 p-6">
        {announcement && (
          <Alert className="mb-4 border-blue-200 bg-blue-50/70">
            <AlertDescription>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-blue-900">{announcement.title}</p>
                  <p className="text-sm text-blue-800">{announcement.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  {announcement.ctaLabel && announcement.ctaUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={announcement.ctaUrl} target="_blank" rel="noreferrer">
                        {announcement.ctaLabel}
                      </a>
                    </Button>
                  )}
                  <Button size="sm" onClick={dismissAnnouncement} disabled={announcementLoading}>
                    {announcementLoading ? 'Saving…' : 'Got it'}
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
        <WorkflowList workflows={workflows} onWorkflowUpdate={loadWorkflows} updateWorkflow={updateWorkflow} n8nBaseUrl={connection?.n8n_url} />
      </main>
      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <SettingsScreen onClose={() => setSettingsOpen(false)} showBillingSection={showBillingSection} />
      </Sheet>
    </div>
  )
}

export default DashboardScreen
