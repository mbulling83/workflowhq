import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '../lib/auth'
import { readApiError } from '../lib/readApiError'
import { verifyConnection } from '../services/n8nProxy'
import { useAuth } from '../hooks/useAuth'
import { useConnection } from '../hooks/useConnection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { createAnnouncement } from '@/services/announcements'
import { fetchFeedbackInbox, type FeedbackSubmission } from '@/services/feedback'
import { fetchBugInbox, type AppErrorLog } from '@/services/errors'

type TestState = 'idle' | 'testing' | 'success' | 'error'
type FeedbackFilter = 'all' | 'feedback' | 'bug' | 'idea' | 'question'
type BugSourceFilter = 'all' | 'api' | 'auth'

interface SettingsScreenProps {
  onClose?: () => void
  showBillingSection?: boolean
}

export function SettingsScreen({ onClose, showBillingSection = true }: SettingsScreenProps = {}) {
  const router = useRouter()
  const { user, token } = useAuth()
  const { connection, loading: connectionLoading } = useConnection()
  const [newUrl, setNewUrl] = useState('')
  const [newKey, setNewKey] = useState('')
  const [editingConnection, setEditingConnection] = useState(false)
  const [testState, setTestState] = useState<TestState>('idle')
  const [testError, setTestError] = useState<string | null>(null)
  const [savingConnection, setSavingConnection] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementMessage, setAnnouncementMessage] = useState('')
  const [announcementCtaLabel, setAnnouncementCtaLabel] = useState('')
  const [announcementCtaUrl, setAnnouncementCtaUrl] = useState('')
  const [publishingAnnouncement, setPublishingAnnouncement] = useState(false)
  const [announcementFeedback, setAnnouncementFeedback] = useState<string | null>(null)
  const [announcementError, setAnnouncementError] = useState<string | null>(null)
  const [feedbackInbox, setFeedbackInbox] = useState<FeedbackSubmission[]>([])
  const [loadingFeedbackInbox, setLoadingFeedbackInbox] = useState(false)
  const [feedbackInboxError, setFeedbackInboxError] = useState<string | null>(null)
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackFilter>('all')
  const [bugInbox, setBugInbox] = useState<AppErrorLog[]>([])
  const [loadingBugInbox, setLoadingBugInbox] = useState(false)
  const [bugInboxError, setBugInboxError] = useState<string | null>(null)
  const [bugSourceFilter, setBugSourceFilter] = useState<BugSourceFilter>('all')
  const softInputClassName = 'border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-slate-300'

  const handleTestConnection = async () => {
    setTestState('testing')
    setTestError(null)
    try {
      await verifyConnection(newUrl || connection?.n8n_url || '', newKey)
      setTestState('success')
    } catch (err) {
      setTestState('error')
      setTestError(err instanceof Error ? err.message : 'Connection failed')
    }
  }

  const handleSaveConnection = async () => {
    setSavingConnection(true)
    try {
      const { data: session } = await authClient.getSession()
      if (!session) throw new Error('Not authenticated')
      const res = await fetch('/api/connection', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.token}`,
        },
        body: JSON.stringify({ n8nUrl: newUrl || connection?.n8n_url, apiKey: newKey }),
      })
      if (!res.ok) throw new Error(await readApiError(res))
      setEditingConnection(false)
      setNewUrl('')
      setNewKey('')
      setTestState('idle')
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSavingConnection(false)
    }
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.email) return
    setDeletingAccount(true)
    await authClient.signOut()
    router.push('/')
  }

  const handlePublishAnnouncement = async () => {
    if (!token) {
      setAnnouncementError('You must be signed in to publish announcements.')
      return
    }
    setPublishingAnnouncement(true)
    setAnnouncementFeedback(null)
    setAnnouncementError(null)
    try {
      await createAnnouncement(token, {
        title: announcementTitle,
        message: announcementMessage,
        ctaLabel: announcementCtaLabel || undefined,
        ctaUrl: announcementCtaUrl || undefined,
      })
      setAnnouncementTitle('')
      setAnnouncementMessage('')
      setAnnouncementCtaLabel('')
      setAnnouncementCtaUrl('')
      setAnnouncementFeedback('Announcement published. Users will see it after login.')
    } catch (err) {
      setAnnouncementError(err instanceof Error ? err.message : 'Failed to publish announcement')
    } finally {
      setPublishingAnnouncement(false)
    }
  }

  const loadFeedbackInbox = useCallback(async () => {
    if (!token) return
    setLoadingFeedbackInbox(true)
    setFeedbackInboxError(null)
    try {
      const rows = await fetchFeedbackInbox({
        category: feedbackFilter,
        limit: 30,
      })
      setFeedbackInbox(rows)
    } catch (err) {
      setFeedbackInboxError(err instanceof Error ? err.message : 'Failed to load feedback inbox')
      setFeedbackInbox([])
    } finally {
      setLoadingFeedbackInbox(false)
    }
  }, [feedbackFilter, token])

  const loadBugInbox = useCallback(async () => {
    if (!token) return
    setLoadingBugInbox(true)
    setBugInboxError(null)
    try {
      const rows = await fetchBugInbox({
        source: bugSourceFilter,
        limit: 30,
      })
      setBugInbox(rows)
    } catch (err) {
      setBugInboxError(err instanceof Error ? err.message : 'Failed to load bug inbox')
      setBugInbox([])
    } finally {
      setLoadingBugInbox(false)
    }
  }, [bugSourceFilter, token])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFeedbackInbox()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadFeedbackInbox])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBugInbox()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadBugInbox])

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 backdrop-blur">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="min-h-10 min-w-10 rounded-lg p-1 text-slate-400 transition-[background-color,color,box-shadow,transform] duration-150 ease-out hover:bg-slate-100 hover:text-slate-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1"
            aria-label="Close settings"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      <main className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100/40 p-4">
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-px hover:border-slate-300 hover:shadow-md">
          <CardHeader className="space-y-1 p-5 pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">n8n Connection</CardTitle>
            <CardDescription>Your connected n8n instance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            {!connectionLoading && connection && !editingConnection && (
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{connection.n8n_url}</p>
                    <p className="text-xs text-slate-500">API Key: ••••••••</p>
                  </div>
                  <Badge variant={connection.verified ? 'default' : 'destructive'}>
                    {connection.verified ? 'Connected' : 'Unverified'}
                  </Badge>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-10 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  onClick={() => setEditingConnection(true)}
                >
                  Update credentials
                </Button>
              </div>
            )}
            {editingConnection && (
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <Label>n8n URL</Label>
                  <Input
                    type="url"
                    className={softInputClassName}
                    placeholder={connection?.n8n_url ?? 'https://my-n8n.example.com'}
                    value={newUrl}
                    onChange={(e) => { setNewUrl(e.target.value); setTestState('idle') }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>New API Key</Label>
                  <Input
                    type="password"
                    className={softInputClassName}
                    placeholder="n8n_api_..."
                    value={newKey}
                    onChange={(e) => { setNewKey(e.target.value); setTestState('idle') }}
                  />
                </div>
                {testState === 'error' && testError && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                    <AlertDescription>{testError}</AlertDescription>
                  </Alert>
                )}
                {testState === 'success' && (
                  <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                    <AlertDescription>Connected successfully!</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-h-10 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    onClick={() => setEditingConnection(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="min-h-10 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    onClick={handleTestConnection}
                    disabled={!newKey || testState === 'testing'}
                  >
                    {testState === 'testing' ? 'Testing…' : 'Test connection'}
                  </Button>
                  {testState === 'success' && (
                    <Button size="sm" className="min-h-10" onClick={handleSaveConnection} disabled={savingConnection}>
                      {savingConnection ? 'Saving…' : 'Save'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-px hover:border-slate-300 hover:shadow-md">
          <CardHeader className="space-y-1 p-5 pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Bug inbox</CardTitle>
            <CardDescription>Recent runtime errors captured from production app logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            <div className="flex flex-wrap gap-2">
              <select
                className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                value={bugSourceFilter}
                onChange={(event) => setBugSourceFilter(event.target.value as BugSourceFilter)}
              >
                <option value="all">All sources</option>
                <option value="api">API</option>
                <option value="auth">Auth</option>
              </select>
              <Button
                variant="secondary"
                className="min-h-10 bg-slate-100 text-slate-700 hover:bg-slate-200"
                onClick={loadBugInbox}
                disabled={loadingBugInbox}
              >
                {loadingBugInbox ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>

            {bugInboxError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                <AlertDescription>{bugInboxError}</AlertDescription>
              </Alert>
            )}

            {!bugInboxError && !bugInbox.length && !loadingBugInbox && (
              <p className="text-sm text-slate-500">No bugs found for this source filter.</p>
            )}

            <div className="space-y-2">
              {bugInbox.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase">{entry.source}</Badge>
                      <Badge variant="secondary" className="uppercase">{entry.category}</Badge>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800">{entry.error_message}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {entry.email ?? 'Unknown user'} · {entry.route ?? 'Unknown route'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-px hover:border-slate-300 hover:shadow-md">
          <CardHeader className="space-y-1 p-5 pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Feedback inbox</CardTitle>
            <CardDescription>Recent user feedback from the floating widget</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            <div className="flex flex-wrap gap-2">
              <select
                className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                value={feedbackFilter}
                onChange={(event) => setFeedbackFilter(event.target.value as FeedbackFilter)}
              >
                <option value="all">All categories</option>
                <option value="feedback">Feedback</option>
                <option value="bug">Bug</option>
                <option value="idea">Idea</option>
                <option value="question">Question</option>
              </select>
              <Button
                variant="secondary"
                className="min-h-10 bg-slate-100 text-slate-700 hover:bg-slate-200"
                onClick={loadFeedbackInbox}
                disabled={loadingFeedbackInbox}
              >
                {loadingFeedbackInbox ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>

            {feedbackInboxError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                <AlertDescription>{feedbackInboxError}</AlertDescription>
              </Alert>
            )}

            {!feedbackInboxError && !feedbackInbox.length && !loadingFeedbackInbox && (
              <p className="text-sm text-slate-500">No feedback yet for this filter.</p>
            )}

            <div className="space-y-2">
              {feedbackInbox.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase">{entry.category}</Badge>
                      {entry.used_voice_input && (
                        <Badge variant="secondary">Voice</Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800">{entry.message}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {entry.email ?? 'Anonymous'} · {entry.page_path ?? 'Unknown page'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-px hover:border-slate-300 hover:shadow-md">
          <CardHeader className="space-y-1 p-5 pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Account</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            <Button
              variant="secondary"
              className="min-h-10 bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
            <Separator />
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-red-600">Danger zone</p>
              <p className="text-xs leading-relaxed text-slate-500">
                This only deletes your account and data in WorkflowHQ. It will not modify, delete, or disconnect anything in your own n8n instances.
                Type your email to confirm.
              </p>
              <Input
                className={softInputClassName}
                placeholder="Type your email to confirm"
                autoComplete="off"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
              <Button variant="destructive" size="sm" className="min-h-10" disabled={deleteConfirm !== user?.email || deletingAccount} onClick={handleDeleteAccount}>
                {deletingAccount ? 'Deleting…' : 'Delete account'}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-px hover:border-slate-300 hover:shadow-md">
          <CardHeader className="space-y-1 p-5 pb-3">
            <CardTitle className="text-base font-semibold tracking-tight">Feature announcement</CardTitle>
            <CardDescription>Publish what is new to logged-in users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 p-5 pt-0">
            <div className="space-y-1">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                className={softInputClassName}
                placeholder="New trigger insights"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                className={softInputClassName}
                placeholder="We now show trigger reliability directly in the workflow list."
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="announcement-cta-label">CTA label (optional)</Label>
                <Input
                  id="announcement-cta-label"
                  className={softInputClassName}
                  placeholder="Read more"
                  value={announcementCtaLabel}
                  onChange={(e) => setAnnouncementCtaLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="announcement-cta-url">CTA URL (optional)</Label>
                <Input
                  id="announcement-cta-url"
                  className={softInputClassName}
                  placeholder="https://..."
                  value={announcementCtaUrl}
                  onChange={(e) => setAnnouncementCtaUrl(e.target.value)}
                />
              </div>
            </div>
            {announcementError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                <AlertDescription>{announcementError}</AlertDescription>
              </Alert>
            )}
            {announcementFeedback && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                <AlertDescription>{announcementFeedback}</AlertDescription>
              </Alert>
            )}
            <Button
              className="min-h-10"
              onClick={handlePublishAnnouncement}
              disabled={!announcementTitle.trim() || !announcementMessage.trim() || publishingAnnouncement}
            >
              {publishingAnnouncement ? 'Publishing…' : 'Publish announcement'}
            </Button>
          </CardContent>
        </Card>
        {showBillingSection && (
          <Card className="rounded-xl border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-px hover:border-slate-300 hover:shadow-md">
            <CardHeader className="space-y-1 p-5 pb-3">
              <CardTitle className="text-base font-semibold tracking-tight">Billing & Plan</CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="py-4 text-center">
                <Badge variant="outline" className="mb-2">Free plan</Badge>
                <p className="text-sm text-slate-500">Billing coming soon.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

export default SettingsScreen
