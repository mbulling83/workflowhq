'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { authClient } from '@/lib/auth'
import { readApiError } from '@/lib/readApiError'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sheet } from '@/components/ui/sheet'

type FeedbackCategory = 'feedback' | 'bug' | 'idea' | 'question'

type SpeechRecognitionCtor = new () => {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult:
    | ((event: { results: ArrayLike<ArrayLike<{ transcript: string; isFinal?: boolean }>> }) => void)
    | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor
    SpeechRecognition?: SpeechRecognitionCtor
  }
}

const CATEGORY_OPTIONS: Array<{ value: FeedbackCategory; label: string }> = [
  { value: 'feedback', label: 'General feedback' },
  { value: 'bug', label: 'Bug report' },
  { value: 'idea', label: 'Feature idea' },
  { value: 'question', label: 'Question' },
]

export function FeedbackWidget() {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth/') || pathname === '/signin' || pathname === '/signup'

  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory>('feedback')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [usedVoiceInput, setUsedVoiceInput] = useState(false)
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null)
  const voiceBaseMessageRef = useRef('')

  const speechSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    setRecording(false)
  }, [])

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const startRecording = useCallback(() => {
    if (typeof window === 'undefined') return

    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    voiceBaseMessageRef.current = message.trim()
    recognition.onresult = (event) => {
      const segments: string[] = []
      for (let i = 0; i < event.results.length; i += 1) {
        const segment = event.results[i]?.[0]?.transcript?.trim()
        if (segment) segments.push(segment)
      }
      const dictatedText = segments.join(' ').trim()
      if (!dictatedText) return
      const base = voiceBaseMessageRef.current
      setMessage(base ? `${base} ${dictatedText}` : dictatedText)
      setUsedVoiceInput(true)
    }
    recognition.onerror = (event) => {
      setError(event.error ? `Voice input error: ${event.error}` : 'Voice input failed')
      setRecording(false)
    }
    recognition.onend = () => {
      setRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
    setError(null)
  }, [message])

  const resetForm = useCallback(() => {
    setCategory('feedback')
    setMessage('')
    setUsedVoiceInput(false)
    setError(null)
    setSuccess(null)
  }, [])

  const submitFeedback = useCallback(async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      setError('Please describe your feedback.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: session } = await authClient.getSession()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (session?.session?.token) {
        headers.Authorization = `Bearer ${session.session.token}`
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category,
          message: trimmedMessage,
          pagePath: pathname ?? '/',
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          usedVoiceInput,
        }),
      })

      if (!response.ok) {
        throw new Error(await readApiError(response))
      }

      setSuccess('Thanks, feedback submitted.')
      setMessage('')
      setUsedVoiceInput(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }, [category, message, pathname, usedVoiceInput])

  if (isAuthPage) return null

  return (
    <>
      <button
        type="button"
        className="fixed bottom-5 right-5 z-50 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        onClick={() => setOpen(true)}
      >
        Feedback
      </button>

      <Sheet
        open={open}
        onClose={() => {
          stopRecording()
          setOpen(false)
        }}
      >
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4 backdrop-blur">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Send feedback</h2>
            <button
              onClick={() => {
                stopRecording()
                setOpen(false)
              }}
              className="min-h-10 min-w-10 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-1"
              aria-label="Close feedback panel"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <main className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-slate-100/40 p-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-category">Category</Label>
              <select
                id="feedback-category"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                value={category}
                onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">What happened? What should improve?</Label>
              <div className="relative">
                <Textarea
                  id="feedback-message"
                  className="min-h-40 resize-none border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-slate-300"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Share your bug report, idea, or general feedback..."
                />
                {speechSupported && (
                  <button
                    type="button"
                    onClick={recording ? stopRecording : startRecording}
                    aria-label={recording ? 'Stop voice input' : 'Use microphone'}
                    title={recording ? 'Stop voice input' : 'Use microphone'}
                    className={`absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ${
                      recording
                        ? 'bg-red-500 text-white shadow-md'
                        : 'bg-slate-200/60 text-slate-400 hover:bg-slate-300 hover:text-slate-600'
                    }`}
                  >
                    {recording ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                        <rect x="1.5" y="1.5" width="7" height="7" rx="1" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4.5" y="1" width="4" height="6" rx="2" />
                        <path d="M2 6.5a4.5 4.5 0 0 0 9 0" />
                        <line x1="6.5" y1="11" x2="6.5" y2="12.5" />
                        <line x1="4.5" y1="12.5" x2="8.5" y2="12.5" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
              Page captured: <span className="font-medium text-slate-700">{pathname ?? '/'}</span>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
          </main>

          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="min-h-10 bg-slate-100 text-slate-700 hover:bg-slate-200"
                onClick={resetForm}
                disabled={submitting}
              >
                Reset
              </Button>
              <Button type="button" className="min-h-10 flex-1" onClick={submitFeedback} disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit feedback'}
              </Button>
            </div>
          </div>
        </div>
      </Sheet>
    </>
  )
}
