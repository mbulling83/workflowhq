'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type LandingScreenProps = {
  showPricingSection?: boolean
}

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
            See what is running, what is broken, and what needs attention in one clean view.
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
                    <span className="tab-chip active">Cron 12</span>
                    <span className="tab-chip">Webhooks 9</span>
                    <span className="tab-chip">AI Agents 6</span>
                    <span className="tab-chip">Manual 15</span>
                  </div>

                  <div className="placeholder-controls">
                    <span className="control-chip search">Search cron triggers...</span>
                    <span className="control-chip">Active</span>
                    <span className="control-chip">Last executed</span>
                    <span className="control-chip">List</span>
                  </div>

                  <div className="placeholder-list">
                    <div className="placeholder-list-header">
                      <span>Workflow</span>
                      <span>Schedule</span>
                      <span>Status</span>
                      <span>Last run</span>
                    </div>

                    <div className="placeholder-workflow">
                      <div className="workflow-info">
                        <div className="workflow-name">Daily revenue digest</div>
                        <div className="workflow-meta">Runs at 09:00 UTC</div>
                      </div>
                      <div className="workflow-meta">0 9 * * *</div>
                      <div className="workflow-status active">Active</div>
                      <div className="workflow-meta">2m ago</div>
                    </div>

                    <div className="placeholder-workflow">
                      <div className="workflow-info">
                        <div className="workflow-name">Lead enrichment sync</div>
                        <div className="workflow-meta">Runs every 30 minutes</div>
                      </div>
                      <div className="workflow-meta">*/30 * * * *</div>
                      <div className="workflow-status active">Active</div>
                      <div className="workflow-meta">12m ago</div>
                    </div>

                    <div className="placeholder-workflow">
                      <div className="workflow-info">
                        <div className="workflow-name">Customer retry notifier</div>
                        <div className="workflow-meta">Runs at 15:00 UTC</div>
                      </div>
                      <div className="workflow-meta">0 15 * * 1-5</div>
                      <div className="workflow-status paused">Paused</div>
                      <div className="workflow-meta">1h ago</div>
                    </div>
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
                Get immediate visibility and start finding issues, bottlenecks, and opportunities.
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
