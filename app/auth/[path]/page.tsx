'use client'

import Link from 'next/link'
import { AuthView } from '@neondatabase/neon-js/auth/react/ui'
import { AppProviders } from '@/components/AppProviders'

const COPY: Record<string, { heading: string; sub: string }> = {
  'sign-in': {
    heading: 'Welcome back',
    sub: 'Sign in to manage your n8n workflows.',
  },
  'sign-up': {
    heading: 'Get started free',
    sub: 'Connect your n8n instance in under 2 minutes.',
  },
}

export default function AuthPathPage({ params }: { params: { path: string } }) {
  const { path } = params
  const copy = COPY[path] ?? COPY['sign-in']

  return (
    <AppProviders>
      <main
        style={{
          minHeight: '100vh',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: 'radial-gradient(circle at 20% 0%, #e2e8f0 0%, #f1f5f9 40%, #f8fafc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '1080px',
            minHeight: '680px',
            display: 'flex',
            borderRadius: '24px',
            overflow: 'hidden',
            background: '#f8fafc',
            boxShadow: '0 28px 70px rgba(15, 23, 42, 0.18), 0 8px 24px rgba(15, 23, 42, 0.08)',
            border: '1px solid rgba(148, 163, 184, 0.28)',
          }}
        >

        {/* Left panel — branding */}
        <div style={{
          display: 'none',
          flex: '0 0 430px',
          background: '#0f172a',
          padding: '3rem',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }} className="auth-left-panel">

          {/* Subtle grid */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              WorkflowHQ
            </Link>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ color: '#f1f5f9', fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 1rem' }}>
              {copy.heading}
            </h1>
            <p style={{ color: 'rgba(241,245,249,0.65)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              {copy.sub}
            </p>

            <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: '⚡', text: 'All triggers at a glance — cron, webhooks, AI agents' },
                { icon: '🔒', text: 'API keys encrypted at rest with AES-256-GCM' },
                { icon: '⏱', text: 'Up and running in under 2 minutes' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.05rem' }}>{icon}</span>
                  <span style={{ color: 'rgba(241,245,249,0.7)', fontSize: '0.875rem', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(241,245,249,0.35)', fontSize: '0.8rem', margin: 0 }}>
              © 2026 WorkflowHQ
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2.5rem',
          borderLeft: '1px solid rgba(148, 163, 184, 0.22)',
        }}>

          {/* Mobile logo */}
          <div style={{ width: '100%', maxWidth: '400px', marginBottom: '2rem' }} className="auth-mobile-logo">
            <Link href="/" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              ← WorkflowHQ
            </Link>
          </div>

          <div style={{ width: '100%', maxWidth: '400px' }}>
            <AuthView path={path} />
          </div>
        </div>

      </div>

      <style>{`
        @media (min-width: 768px) {
          .auth-left-panel { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }

        .auth-mobile-logo a {
          color: #334155 !important;
        }

        .auth-mobile-logo a:hover {
          color: #0f172a !important;
        }

        .auth-left-panel h1 {
          text-wrap: balance;
        }

        .auth-left-panel p {
          text-wrap: pretty;
        }

        @media (max-width: 767px) {
          main {
            padding: 1rem !important;
          }
        }
      `}</style>
      </main>
    </AppProviders>
  )
}
