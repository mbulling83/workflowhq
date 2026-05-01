import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '../lib/auth'
import { readApiError } from '../lib/readApiError'
import { verifyConnection, UnauthorizedError } from '../services/n8nProxy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Step = 'url' | 'apikey'
type TestState = 'idle' | 'testing' | 'success' | 'error'

export function OnboardingScreen() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('url')
  const [n8nUrl, setN8nUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [testState, setTestState] = useState<TestState>('idle')
  const [testError, setTestError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const settingsApiUrl = `${n8nUrl.replace(/\/$/, '')}/settings/api`
  const cardClassName = 'w-full max-w-2xl rounded-xl border-slate-200 bg-white shadow-sm'
  const softInputClassName = 'border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-slate-300'

  const handleUrlNext = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      new URL(n8nUrl)
      setStep('apikey')
    } catch {
      setTestError('Please enter a valid n8n URL.')
    }
  }

  const handleTestConnection = async () => {
    setTestState('testing')
    setTestError(null)
    try {
      await verifyConnection(n8nUrl, apiKey)
      setTestState('success')
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.replace('/auth/sign-in?from=/onboard')
        return
      }
      setTestState('error')
      setTestError(err instanceof Error ? err.message : 'Could not connect. Please check the URL and API key.')
    }
  }

  const handleSaveAndContinue = async () => {
    setSaving(true)
    try {
      const { data: session } = await authClient.getSession()
      if (!session) {
        router.replace('/auth/sign-in?from=/onboard')
        return
      }
      const res = await fetch('/api/connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.token}`,
        },
        body: JSON.stringify({ n8nUrl, apiKey }),
      })
      if (res.status === 401) {
        router.replace('/auth/sign-in?from=/onboard')
        return
      }
      if (!res.ok) throw new Error(await readApiError(res))
      router.push('/app')
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Could not save your connection. Please try again.')
      setSaving(false)
    }
  }

  if (step === 'url') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/40 p-4">
        <Card className={cardClassName}>
          <CardHeader className="space-y-1 p-8 pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Connect your n8n instance</CardTitle>
            <CardDescription className="text-base text-slate-700">Step 1 of 2 — Enter your n8n URL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-8 pt-0">
            <form onSubmit={handleUrlNext} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-base font-medium text-slate-900">n8n URL</Label>
                <Input
                  id="url"
                  type="url"
                  className={`${softInputClassName} min-h-12`}
                  placeholder="https://my-n8n.example.com"
                  value={n8nUrl}
                  onChange={(e) => {
                    setN8nUrl(e.target.value)
                    setTestError(null)
                  }}
                  required
                />
                <p className="text-sm text-slate-500">The base URL of your n8n instance, e.g. https://my-n8n.example.com</p>
              </div>
              {testError && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="min-h-12 w-full">Next</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/40 p-4">
      <Card className={cardClassName}>
        <CardHeader className="space-y-1 p-8 pb-4">
          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Connect your n8n instance</CardTitle>
          <CardDescription className="text-base text-slate-700">Step 2 of 2 — Add your API key</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8 pt-0">
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-base text-slate-700">
            <p className="text-base font-semibold tracking-tight text-slate-900">Generate your key in n8n</p>
            <p>
              1. Open{' '}
              <a href={settingsApiUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline underline-offset-2 hover:text-blue-700">
                {settingsApiUrl}
              </a>
            </p>
            <p>2. Create an API key with only these scopes: <code className="rounded bg-slate-200 px-1">workflow:read</code> and <code className="rounded bg-slate-200 px-1">workflow:list</code>.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="apikey" className="text-base font-medium text-slate-900">n8n API Key</Label>
            <Input
              id="apikey"
              type="password"
              className={`${softInputClassName} min-h-12`}
              placeholder="n8n_api_..."
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setTestState('idle') }}
            />
            <p className="text-sm text-slate-500">Paste the API key you created from your instance settings page.</p>
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
          <div className="flex gap-2">
            <Button variant="secondary" className="min-h-12 bg-slate-100 px-8 text-slate-700 hover:bg-slate-200" onClick={() => setStep('url')} disabled={saving}>Back</Button>
            <Button
              variant="secondary"
              onClick={handleTestConnection}
              disabled={!apiKey || testState === 'testing' || saving}
              className="min-h-12 flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              {testState === 'testing' ? 'Testing…' : 'Test connection'}
            </Button>
          </div>
          {testState === 'success' && (
            <Button className="min-h-12 w-full" onClick={handleSaveAndContinue} disabled={saving}>
              {saving ? 'Saving…' : 'Save & go to dashboard'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default OnboardingScreen
