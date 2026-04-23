import { useState } from 'react'
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

type TestState = 'idle' | 'testing' | 'success' | 'error'

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

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 backdrop-blur">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="min-h-10 min-w-10 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1"
            aria-label="Close settings"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      <main className="flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100/40 p-5">
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold tracking-tight">n8n Connection</CardTitle>
            <CardDescription>Your connected n8n instance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!connectionLoading && connection && !editingConnection && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{connection.n8n_url}</p>
                    <p className="text-xs text-slate-500">API Key: ••••••••</p>
                  </div>
                  <Badge variant={connection.verified ? 'default' : 'destructive'}>
                    {connection.verified ? 'Connected' : 'Unverified'}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" className="min-h-10" onClick={() => setEditingConnection(true)}>Update credentials</Button>
              </div>
            )}
            {editingConnection && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>n8n URL</Label>
                  <Input type="url" placeholder={connection?.n8n_url ?? 'https://my-n8n.example.com'} value={newUrl} onChange={(e) => { setNewUrl(e.target.value); setTestState('idle') }} />
                </div>
                <div className="space-y-1">
                  <Label>New API Key</Label>
                  <Input type="password" placeholder="n8n_api_..." value={newKey} onChange={(e) => { setNewKey(e.target.value); setTestState('idle') }} />
                </div>
                {testState === 'error' && testError && (
                  <Alert variant="destructive"><AlertDescription>{testError}</AlertDescription></Alert>
                )}
                {testState === 'success' && (
                  <Alert><AlertDescription>Connected successfully!</AlertDescription></Alert>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="min-h-10" onClick={() => setEditingConnection(false)}>Cancel</Button>
                  <Button variant="outline" size="sm" className="min-h-10" onClick={handleTestConnection} disabled={!newKey || testState === 'testing'}>
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
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold tracking-tight">Account</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="min-h-10" onClick={handleSignOut}>Sign out</Button>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">Danger zone</p>
              <p className="text-xs text-slate-500">Permanently delete your account and all stored credentials. Type your email to confirm.</p>
              <Input placeholder={user?.email} value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
              <Button variant="destructive" size="sm" className="min-h-10" disabled={deleteConfirm !== user?.email || deletingAccount} onClick={handleDeleteAccount}>
                {deletingAccount ? 'Deleting…' : 'Delete account'}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold tracking-tight">Feature announcement</CardTitle>
            <CardDescription>Publish what is new to logged-in users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="announcement-title">Title</Label>
              <Input
                id="announcement-title"
                placeholder="New trigger insights"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
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
                  placeholder="Read more"
                  value={announcementCtaLabel}
                  onChange={(e) => setAnnouncementCtaLabel(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="announcement-cta-url">CTA URL (optional)</Label>
                <Input
                  id="announcement-cta-url"
                  placeholder="https://..."
                  value={announcementCtaUrl}
                  onChange={(e) => setAnnouncementCtaUrl(e.target.value)}
                />
              </div>
            </div>
            {announcementError && (
              <Alert variant="destructive">
                <AlertDescription>{announcementError}</AlertDescription>
              </Alert>
            )}
            {announcementFeedback && (
              <Alert>
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
          <Card className="rounded-xl border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold tracking-tight">Billing & Plan</CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-6 text-center">
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
