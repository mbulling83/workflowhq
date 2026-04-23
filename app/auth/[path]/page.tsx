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
      <main className="auth-page">
        <div className="auth-shell">

        {/* Left panel — branding */}
        <div className="auth-left-panel">

          {/* Subtle grid */}
          <div className="auth-grid-overlay" />

          <div className="auth-layer">
            <Link href="/" className="auth-brand-link">
              WorkflowHQ
            </Link>
          </div>

          <div className="auth-layer">
            <h1 className="auth-copy-title">
              {copy.heading}
            </h1>
            <p className="auth-copy-sub">
              {copy.sub}
            </p>

            <div className="auth-points">
              {[
                { icon: '⚡', text: 'All triggers at a glance — cron, webhooks, AI agents' },
                { icon: '🔒', text: 'API keys encrypted at rest with AES-256-GCM' },
                { icon: '⏱', text: 'Up and running in under 2 minutes' },
              ].map(({ icon, text }) => (
                <div key={text} className="auth-point">
                  <span className="auth-point-icon">{icon}</span>
                  <span className="auth-point-copy">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="auth-layer">
            <p className="auth-copyright">
              © 2026 WorkflowHQ
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-right-panel">

          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <Link href="/">
              ← WorkflowHQ
            </Link>
          </div>

          <div className="auth-form-shell">
            <AuthView path={path} />
          </div>
        </div>

      </div>

      <style>{`
        @media (min-width: 768px) {
          .auth-left-panel { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }

        .auth-page {
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: radial-gradient(circle at 20% 0%, #e2e8f0 0%, #f1f5f9 35%, #f8fafc 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .auth-shell {
          width: 100%;
          max-width: 1080px;
          min-height: 680px;
          display: flex;
          border-radius: 24px;
          overflow: hidden;
          background: #f8fafc;
          box-shadow: 0 28px 70px rgba(15, 23, 42, 0.16), 0 8px 24px rgba(15, 23, 42, 0.06);
          border: 1px solid rgba(148, 163, 184, 0.24);
        }

        .auth-left-panel {
          display: none;
          flex: 0 0 430px;
          background: #0f172a;
          padding: 3rem;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .auth-grid-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .auth-layer {
          position: relative;
          z-index: 1;
        }

        .auth-brand-link {
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: -0.02em;
          transition: color 140ms ease;
        }

        .auth-brand-link:hover {
          color: #cbd5e1;
        }

        .auth-copy-title {
          color: #f1f5f9;
          font-size: 1.75rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0 0 1rem;
          text-wrap: balance;
        }

        .auth-copy-sub {
          color: rgba(241,245,249,0.65);
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0;
          text-wrap: pretty;
        }

        .auth-points {
          margin-top: 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .auth-point {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .auth-point-icon {
          font-size: 1rem;
          flex-shrink: 0;
          margin-top: 0.05rem;
        }

        .auth-point-copy {
          color: rgba(241,245,249,0.7);
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .auth-copyright {
          color: rgba(241,245,249,0.35);
          font-size: 0.8rem;
          margin: 0;
        }

        .auth-right-panel {
          flex: 1;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2.5rem;
          border-left: 1px solid rgba(148, 163, 184, 0.2);
        }

        .auth-mobile-logo {
          width: 100%;
          max-width: 420px;
          margin-bottom: 2rem;
        }

        .auth-mobile-logo a {
          color: #334155 !important;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: -0.02em;
        }

        .auth-mobile-logo a:hover {
          color: #0f172a !important;
        }

        .auth-form-shell {
          width: 100%;
          max-width: 420px;
        }

        .auth-form-shell > * {
          border-radius: 14px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08), 0 1px 0 rgba(255, 255, 255, 0.85) inset;
          padding: 0.25rem;
        }

        .auth-form-shell :is(input, button, a) {
          transition: border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
        }

        .auth-form-shell input {
          border-radius: 10px;
          border-color: #cbd5e1;
        }

        .auth-form-shell input:focus-visible {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
          outline: none;
        }

        .auth-form-shell button {
          min-height: 40px;
          border-radius: 10px;
          font-weight: 600;
        }

        .auth-form-shell button[type='submit'] {
          background: #111827;
          color: #fff;
          border-color: #111827;
          box-shadow: 0 2px 10px rgba(17, 24, 39, 0.22);
        }

        .auth-form-shell button[type='submit']:hover {
          background: #1f2937;
        }

        .auth-form-shell button[type='submit']:active {
          transform: scale(0.98);
        }

        .auth-form-shell a {
          text-underline-offset: 2px;
        }

        .auth-form-shell a:hover {
          color: #1f2937;
        }

        .auth-form-shell :is(button, a):focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
        }

        @media (max-width: 767px) {
          .auth-page {
            padding: 1rem !important;
          }

          .auth-shell {
            min-height: 0;
          }

          .auth-right-panel {
            padding: 2rem 1.25rem;
          }
        }
      `}</style>
      </main>
    </AppProviders>
  )
}
