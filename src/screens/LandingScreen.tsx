'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type LandingScreenProps = {
  showPricingSection?: boolean
}

type DemoTabId = 'cron' | 'webhooks' | 'ai-agents' | 'manual'

type DemoWorkflow = {
  name: string
  meta: string
  trigger: string
  status: 'Active' | 'Paused'
  lastRun: string
}

type DemoTab = {
  id: DemoTabId
  label: string
  count: number
  searchPlaceholder: string
  rows: DemoWorkflow[]
}

const DEMO_TABS: DemoTab[] = [
  {
    id: 'cron',
    label: 'Cron',
    count: 12,
    searchPlaceholder: 'Search cron triggers...',
    rows: [
      { name: 'Daily revenue digest', meta: 'Runs at 09:00 UTC', trigger: '0 9 * * *', status: 'Active', lastRun: '2m ago' },
      { name: 'Lead enrichment sync', meta: 'Runs every 30 minutes', trigger: '*/30 * * * *', status: 'Active', lastRun: '12m ago' },
      { name: 'Customer retry notifier', meta: 'Runs at 15:00 UTC', trigger: '0 15 * * 1-5', status: 'Paused', lastRun: '1h ago' },
    ],
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    count: 9,
    searchPlaceholder: 'Search webhook endpoints...',
    rows: [
      { name: 'Stripe checkout event', meta: 'POST /webhook/stripe-checkout', trigger: 'POST', status: 'Active', lastRun: '26s ago' },
      { name: 'HubSpot lead capture', meta: 'POST /webhook/hubspot-lead', trigger: 'POST', status: 'Active', lastRun: '4m ago' },
      { name: 'Inventory update relay', meta: 'PUT /webhook/inventory-sync', trigger: 'PUT', status: 'Paused', lastRun: '58m ago' },
    ],
  },
  {
    id: 'ai-agents',
    label: 'AI Agents',
    count: 6,
    searchPlaceholder: 'Search AI workflows...',
    rows: [
      { name: 'Support triage assistant', meta: 'Routes tickets by intent', trigger: 'OpenAI + Claude', status: 'Active', lastRun: '41s ago' },
      { name: 'Invoice extraction reviewer', meta: 'Validates OCR confidence', trigger: 'Gemini + Rules', status: 'Active', lastRun: '7m ago' },
      { name: 'Prospect research copilot', meta: 'Enriches CRM records', trigger: 'Perplexity API', status: 'Paused', lastRun: '3h ago' },
    ],
  },
  {
    id: 'manual',
    label: 'Manual',
    count: 15,
    searchPlaceholder: 'Search manual triggers...',
    rows: [
      { name: 'Re-run failed syncs', meta: 'Ops trigger for incidents', trigger: 'Manual trigger', status: 'Active', lastRun: '9m ago' },
      { name: 'Backfill contacts by segment', meta: 'Started by revops team', trigger: 'Manual trigger', status: 'Active', lastRun: '1d ago' },
      { name: 'Archive stale campaigns', meta: 'One-click cleanup flow', trigger: 'Manual trigger', status: 'Paused', lastRun: '5d ago' },
    ],
  },
]

export function LandingScreen({ showPricingSection = true }: LandingScreenProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    const storedTheme = window.localStorage.getItem('landing-theme')
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [activeDemoTabId, setActiveDemoTabId] = useState<DemoTabId>('cron')
  const activeDemoTab = DEMO_TABS.find((tab) => tab.id === activeDemoTabId) ?? DEMO_TABS[0]

  useEffect(() => {
    window.localStorage.setItem('landing-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <div className="landing-page" data-theme={theme}>
      {/* Top Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link href="/" className="landing-nav-logo">WorkflowHQ</Link>
          <div className="landing-nav-actions">
            <button
              type="button"
              className="landing-nav-theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <Link href="/auth/sign-in" className="landing-nav-link">Sign in</Link>
            <Link href="/auth/sign-up" className="landing-nav-cta">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">⚡</span>
            <span className="badge-text">Clarity for busy automation teams</span>
          </div>

          <h1 className="hero-title">
            Stop guessing what your workflows are doing
            <span className="hero-title-gradient"> and take control fast</span>
          </h1>

          <p className="hero-description">
            See what is running and what needs attention in one clean view.
            Manage schedules, webhooks, and AI agents without digging through dozens of workflow pages.
          </p>

          <div className="hero-cta-group">
            <Link href="/auth/sign-up" className="hero-cta-button">
              Get Started — Free
              <span className="button-arrow">→</span>
            </Link>
            <Link href="/auth/sign-in" className="hero-demo-button">
              Sign In
              <span className="button-arrow">→</span>
            </Link>
          </div>
          <p className="hero-cta-hint">No credit card required · Free plan available</p>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">2 min</div>
              <div className="stat-label">Time to first insight</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">100%</div>
              <div className="stat-label">Your data stays yours</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">Encrypted</div>
              <div className="stat-label">By default</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="screenshot-container">
            <div className="browser-frame">
              <div className="browser-header">
                <div className="browser-dots">
                  <span className="dot dot-red"></span>
                  <span className="dot dot-yellow"></span>
                  <span className="dot dot-green"></span>
                </div>
                <div className="browser-tabs">
                  <div className="browser-tab active">
                    <span className="tab-icon">🔒</span>
                    <span className="tab-title">WorkflowHQ</span>
                    <span className="tab-close">×</span>
                  </div>
                  <div className="browser-tab">
                    <span className="tab-icon">+</span>
                  </div>
                </div>
              </div>
              <div className="browser-toolbar">
                <div className="browser-nav">
                  <button className="nav-button" disabled>←</button>
                  <button className="nav-button" disabled>→</button>
                  <button className="nav-button">↻</button>
                </div>
                <div className="browser-address-bar">
                  <span className="address-bar-icon">🔒</span>
                  <span className="address-bar-url">workflowhq.app</span>
                </div>
                <div className="browser-actions">
                  <button className="browser-menu">⋮</button>
                </div>
              </div>
              <div className="browser-content">
                <div className="screenshot-placeholder">
                  <div className="placeholder-topnav">
                    <div className="placeholder-brand">
                      <span className="placeholder-title">WorkflowHQ</span>
                      <span className="placeholder-count">42 workflows</span>
                    </div>
                    <div className="placeholder-actions">
                      <span className="placeholder-button ghost">Settings</span>
                      <span className="placeholder-button ghost">Sign out</span>
                    </div>
                  </div>

                  <div className="placeholder-tabs">
                    {DEMO_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`tab-chip ${tab.id === activeDemoTabId ? 'active' : ''}`}
                        onClick={() => setActiveDemoTabId(tab.id)}
                      >
                        {tab.label} {tab.count}
                      </button>
                    ))}
                  </div>

                  <div className="placeholder-controls">
                    <span className="control-chip search">{activeDemoTab.searchPlaceholder}</span>
                    <span className="control-chip">Active</span>
                    <span className="control-chip">Last executed</span>
                    <span className="control-chip">List</span>
                  </div>

                  <div className="placeholder-list">
                    <div className="placeholder-list-header">
                      <span>Workflow</span>
                      <span>Trigger</span>
                      <span>Status</span>
                      <span>Last run</span>
                    </div>

                    {activeDemoTab.rows.map((row) => (
                      <div className="placeholder-workflow" key={row.name}>
                        <div className="workflow-info">
                          <div className="workflow-name">{row.name}</div>
                          <div className="workflow-meta">{row.meta}</div>
                        </div>
                        <div className="workflow-meta">{row.trigger}</div>
                        <div className={`workflow-status ${row.status.toLowerCase()}`}>{row.status}</div>
                        <div className="workflow-meta">{row.lastRun}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section">
        <div className="section-content">
          <p className="section-label">The Problem</p>
          <h2 className="section-title">
            When automation grows, visibility drops <span className="highlight">and problems hide in plain sight</span>
          </h2>
          <div className="problem-grid">
            <div className="problem-card">
              <span className="problem-icon">🔍</span>
              <h3>Hard to find workflows</h3>
              <p>Waste less time searching and more time fixing what matters.</p>
            </div>
            <div className="problem-card">
              <span className="problem-icon">📅</span>
              <h3>Can&apos;t see schedules at a glance</h3>
              <p>Missed schedules lead to missed reports, alerts, and follow-ups.</p>
            </div>
            <div className="problem-card">
              <span className="problem-icon">🔗</span>
              <h3>Webhook URLs buried deep</h3>
              <p>Simple tasks take too many clicks when you are under pressure.</p>
            </div>
            <div className="problem-card">
              <span className="problem-icon">🤖</span>
              <h3>No AI agent overview</h3>
              <p>It is hard to trust results when you cannot quickly inspect agent setup.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-content">
          <p className="section-label">Features</p>
          <h2 className="section-title">
            Everything you need to run automation <span className="highlight">with confidence</span>
          </h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">See the full picture instantly</h3>
              <p className="feature-description">
                Get one organized view of every workflow so you can spot priorities and act quickly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">Find anything in seconds</h3>
              <p className="feature-description">
                Search by name, status, or trigger type to jump straight to the workflow you need.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3 className="feature-title">Never miss a schedule</h3>
              <p className="feature-description">
                Keep schedules visible in one place so time-based automations stay reliable.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3 className="feature-title">Copy webhook details instantly</h3>
              <p className="feature-description">
                Grab URLs, methods, and auth details fast when integrations need updates.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">Keep AI agents under control</h3>
              <p className="feature-description">
                Review models, providers, and prompts quickly so agent behavior stays predictable.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3 className="feature-title">Jump in with one click</h3>
              <p className="feature-description">
                Open the exact workflow you need in N8N without losing momentum.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌙</div>
              <h3 className="feature-title">Comfortable, all-day workspace</h3>
              <p className="feature-description">
                Light and dark themes help your team stay focused during long operations and incident response.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Security built in</h3>
              <p className="feature-description">
                Credentials and keys are encrypted by default so you can move fast with peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-content">
          <p className="section-label">How It Works</p>
          <h2 className="section-title">
            Go from setup to value <span className="highlight">in minutes</span>
          </h2>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Create your account</h3>
              <p className="step-description">
                Sign up in seconds and invite your team when you are ready.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Connect your N8N instance</h3>
              <p className="step-description">
                Add your N8N URL and API key. Connection checks happen automatically.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Start managing workflows</h3>
              <p className="step-description">
                Get immediate visibility and start finding bottlenecks and opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="social-proof-section">
        <div className="section-content">
          <p className="section-label">Why Choose Us</p>
          <h2 className="section-title">
            Built for teams who need <span className="highlight">reliable automation at scale</span>
          </h2>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">💻</div>
              <h3>Access from anywhere</h3>
              <p>Check and manage workflows from anywhere without depending on one machine.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3>Fast when it counts</h3>
              <p>Handle large workflow collections quickly, even during high-pressure moments.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🔓</div>
              <h3>Flexible and customizable</h3>
              <p>Shape views and processes around your team&apos;s way of working as needs evolve.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🛡️</div>
              <h3>Secure by default</h3>
              <p>Protect sensitive credentials automatically without adding security overhead.</p>
            </div>
          </div>
        </div>
      </section>

      {showPricingSection && (
        <section className="pricing-section">
            <div className="section-content">
              <p className="section-label">Pricing</p>
              <h2 className="section-title">
                Start free, then unlock deeper workflow control <span className="highlight">as you scale</span>
              </h2>

              <div className="pricing-grid">
                <article className="pricing-card">
                  <p className="pricing-tier">Free</p>
                  <div className="pricing-value">
                    <span className="price-amount">$0</span>
                    <span className="price-period">/month</span>
                  </div>
                  <p className="pricing-description">
                    Everything you need to get clear visibility across your workflows from day one.
                  </p>
                  <ul className="pricing-features">
                    <li>Workflow visibility, search, and filtering</li>
                    <li>Cron schedule overview</li>
                    <li>Webhook URL quick access</li>
                    <li>AI agent dashboard</li>
                  </ul>
                  <Link href="/auth/sign-up" className="pricing-button pricing-button-secondary">
                    Start Free
                  </Link>
                </article>

                <article className="pricing-card pricing-card-featured">
                  <p className="pricing-badge">Recommended</p>
                  <p className="pricing-tier">In-Cloud</p>
                  <div className="pricing-value">
                    <span className="price-amount">$4</span>
                    <span className="price-period">/month</span>
                  </div>
                  <p className="pricing-description">
                    Advanced workflow operations for growing teams that need speed, consistency, and control.
                  </p>
                  <ul className="pricing-features">
                    <li>Edit workflows directly in WorkflowHQ</li>
                    <li>Bulk edit workflows in one place</li>
                    <li>All AI features included</li>
                    <li>Priority support</li>
                  </ul>
                  <Link href="/auth/sign-up" className="pricing-button pricing-button-primary">
                    Upgrade to In-Cloud
                  </Link>
                </article>
              </div>
            </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to make your automation easier to run?</h2>
          <p className="cta-description">
            Start free today and give your team one clear place to manage every workflow.
          </p>
          <Link href="/auth/sign-up" className="cta-button">
            Get Started
            <span className="button-arrow">→</span>
          </Link>
          <p className="cta-hint">Free plan available · In-cloud plan starts at $4/month</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">WorkflowHQ</div>
            <p className="footer-tagline">The clearest way to run your N8N operations</p>
          </div>
          <div className="footer-links">
            <Link href="/auth/sign-in" className="footer-link">Sign In</Link>
            <Link href="/auth/sign-up" className="footer-link">Sign Up</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2026 WorkflowHQ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingScreen
