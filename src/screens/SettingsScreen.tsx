import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '../lib/auth'
import { readApiError } from '../lib/readApiError'
import { verifyConnection } from '../services/n8nProxy'
import { useAuth } from '../hooks/useAuth'
import { useConnection } from '../hooks/useConnection'
import { TopNav } from '../components/TopNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

type TestState = 'idle' | 'testing' | 'success' | 'error'

export function SettingsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { connection, loading: connectionLoading } = useConnection()
  const [newUrl, setNewUrl] = useState('')
  const [newKey, setNewKey] = useState('')
  const [editingConnection, setEditingConnection] = useState(false)
  const [testState, setTestState] = useState<TestState>('idle')
  const [testError, setTestError] = useState<string | null>(null)
  const [savingConnection, setSavingConnection] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TopNav />
      <main className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>n8n Connection</CardTitle>
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
                <Button variant="outline" size="sm" onClick={() => setEditingConnection(true)}>Update credentials</Button>
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
                  <Button variant="outline" size="sm" onClick={() => setEditingConnection(false)}>Cancel</Button>
                  <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={!newKey || testState === 'testing'}>
                    {testState === 'testing' ? 'Testing…' : 'Test connection'}
                  </Button>
                  {testState === 'success' && (
                    <Button size="sm" onClick={handleSaveConnection} disabled={savingConnection}>
                      {savingConnection ? 'Saving…' : 'Save'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">Danger zone</p>
              <p className="text-xs text-slate-500">Permanently delete your account and all stored credentials. Type your email to confirm.</p>
              <Input placeholder={user?.email} value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
              <Button variant="destructive" size="sm" disabled={deleteConfirm !== user?.email || deletingAccount} onClick={handleDeleteAccount}>
                {deletingAccount ? 'Deleting…' : 'Delete account'}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Billing & Plan</CardTitle>
            <CardDescription>Manage your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-6 text-center">
              <Badge variant="outline" className="mb-2">Free plan</Badge>
              <p className="text-sm text-slate-500">Billing coming soon.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default SettingsScreen
