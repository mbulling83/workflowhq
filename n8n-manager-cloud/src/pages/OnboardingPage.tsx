// src/pages/OnboardingPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { verifyConnection } from '../services/n8nProxy'
import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Step = 'url' | 'apikey'
type TestState = 'idle' | 'testing' | 'success' | 'error'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep] = useState<Step>('url')
  const [n8nUrl, setN8nUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [testState, setTestState] = useState<TestState>('idle')
  const [testError, setTestError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleUrlNext = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      new URL(n8nUrl)
      setStep('apikey')
    } catch {
      // URL constructor throws for invalid URLs
    }
  }

  const handleTestConnection = async () => {
    setTestState('testing')
    setTestError(null)
    try {
      await verifyConnection(n8nUrl, apiKey)
      setTestState('success')
    } catch (err) {
      setTestState('error')
      setTestError(err instanceof Error ? err.message : 'Connection failed')
    }
  }

  const handleSaveAndContinue = async () => {
    if (!user) return
    setSaving(true)

    try {
      // Store API key in Vault, get back the secret name
      const secretName = `user_${user.id}_n8n_key`

      // Insert or update the Vault secret
      const { error: vaultError } = await supabase.rpc('vault_create_or_update_secret', {
        secret: apiKey,
        name: secretName,
      })

      if (vaultError) throw vaultError

      // Upsert the connection row (unique on user_id)
      const { error: upsertError } = await supabase
        .from('user_connections')
        .upsert({
          user_id: user.id,
          n8n_url: n8nUrl,
          api_key_secret: secretName,
          verified: true,
        })

      if (upsertError) throw upsertError

      navigate('/app')
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Failed to save credentials')
      setSaving(false)
    }
  }

  if (step === 'url') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect your n8n instance</CardTitle>
            <CardDescription>Step 1 of 2 — Enter your n8n URL</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUrlNext} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">n8n URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://my-n8n.example.com"
                  value={n8nUrl}
                  onChange={(e) => setN8nUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-500">
                  The base URL of your n8n instance, e.g. https://my-n8n.example.com
                </p>
              </div>
              <Button type="submit" className="w-full">Next</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect your n8n instance</CardTitle>
          <CardDescription>Step 2 of 2 — Add your API key</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apikey">n8n API Key</Label>
            <Input
              id="apikey"
              type="password"
              placeholder="n8n_api_..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setTestState('idle')
              }}
            />
            <p className="text-xs text-slate-500">
              Find this in n8n → Settings → API → Create an API key
            </p>
          </div>

          {testState === 'error' && testError && (
            <Alert variant="destructive">
              <AlertDescription>{testError}</AlertDescription>
            </Alert>
          )}

          {testState === 'success' && (
            <Alert>
              <AlertDescription>Connected successfully!</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep('url')}
              disabled={saving}
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={!apiKey || testState === 'testing' || saving}
              className="flex-1"
            >
              {testState === 'testing' ? 'Testing…' : 'Test connection'}
            </Button>
          </div>

          {testState === 'success' && (
            <Button
              className="w-full"
              onClick={handleSaveAndContinue}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save & go to dashboard'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
