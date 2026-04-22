import Link from 'next/link'
import './LandingPage.css'

export function LandingScreen() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">⚡</span>
            <span className="badge-text">Your N8N, Supercharged</span>
          </div>

          <h1 className="hero-title">
            Manage your N8N workflows
            <span className="hero-title-gradient"> at a glance</span>
          </h1>

          <p className="hero-description">
            A beautiful, minimalist dashboard that makes managing hundreds of N8N workflows effortless.
            See schedules, webhooks, and AI agents organized exactly how you need them.
          </p>

          <div className="hero-cta-group">
            <Link href="/signup" className="hero-cta-button">
              Get Started — Free
              <span className="button-arrow">→</span>
            </Link>
            <Link href="/signin" className="hero-demo-button">
              Sign In
              <span className="button-arrow">→</span>
            </Link>
          </div>
          <p className="hero-cta-hint">No credit card required · Free plan available</p>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">2 min</div>
              <div className="stat-label">Setup time</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">100%</div>
              <div className="stat-label">Open source</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">Encrypted</div>
              <div className="stat-label">Data storage</div>
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
                  <div className="placeholder-header">
                    <div className="placeholder-title">WorkflowHQ</div>
                    <div className="placeholder-count">42 workflows</div>
                  </div>
                  <div className="placeholder-filters">
                    <span className="filter-chip active">All</span>
                    <span className="filter-chip">Cron</span>
                    <span className="filter-chip">Webhook</span>
                    <span className="filter-chip">AI Agents</span>
                  </div>
                  <div className="placeholder-workflows">
                    <div className="placeholder-workflow">
                      <div className="workflow-badge cron">⏰</div>
                      <div className="workflow-info">
                        <div className="workflow-name">Daily Report Generator</div>
                        <div className="workflow-meta">Every day at 9:00 AM • Active</div>
                      </div>
                    </div>
                    <div className="placeholder-workflow">
                      <div className="workflow-badge webhook">🔗</div>
                      <div className="workflow-info">
                        <div className="workflow-name">Stripe Payment Handler</div>
                        <div className="workflow-meta">POST /webhook/stripe • Active</div>
                      </div>
                    </div>
                    <div className="placeholder-workflow">
                      <div className="workflow-badge ai">🤖</div>
                      <div className="workflow-info">
                        <div className="workflow-name">Customer Support AI Agent</div>
                        <div className="workflow-meta">GPT-4 • OpenAI • Active</div>
                      </div>
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
            N8N&apos;s interface wasn&apos;t built for <span className="highlight">managing hundreds of workflows</span>
          </h2>
          <div className="problem-grid">
            <div className="problem-card">
              <span className="problem-icon">🔍</span>
              <h3>Hard to find workflows</h3>
              <p>Scrolling through endless lists to find the one workflow you need.</p>
            </div>
            <div className="problem-card">
              <span className="problem-icon">📅</span>
              <h3>Can&apos;t see schedules at a glance</h3>
              <p>Opening each workflow individually just to check when it runs.</p>
            </div>
            <div className="problem-card">
              <span className="problem-icon">🔗</span>
              <h3>Webhook URLs buried deep</h3>
              <p>Clicking through multiple screens to copy a simple webhook URL.</p>
            </div>
            <div className="problem-card">
              <span className="problem-icon">🤖</span>
              <h3>No AI agent overview</h3>
              <p>Can&apos;t see which models, prompts, or providers your agents use.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-content">
          <p className="section-label">Features</p>
          <h2 className="section-title">
            Everything you need to manage workflows <span className="highlight">effortlessly</span>
          </h2>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Instant Overview</h3>
              <p className="feature-description">
                See all your workflows grouped by type: cron schedules, webhooks, AI agents, manual triggers, and more.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">Powerful Search & Filters</h3>
              <p className="feature-description">
                Find any workflow instantly with search, filters, and sorting. Filter by active/inactive, trigger type, or search by name.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3 className="feature-title">Schedule Visibility</h3>
              <p className="feature-description">
                See all cron schedules, timezones, and expressions in one place. No more opening workflows to check when they run.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3 className="feature-title">Quick Webhook Access</h3>
              <p className="feature-description">
                Copy webhook URLs instantly. See HTTP methods, authentication status, and test vs. production URLs at a glance.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI Agent Dashboard</h3>
              <p className="feature-description">
                View all your LangChain agents, models, providers, and prompts. Edit prompts directly without opening N8N.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3 className="feature-title">One-Click Access</h3>
              <p className="feature-description">
                Jump straight to any workflow in N8N with a single click. Seamless integration with your existing setup.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌙</div>
              <h3 className="feature-title">Dark Mode</h3>
              <p className="feature-description">
                Beautiful light and dark themes that are easy on your eyes during long debugging sessions.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Security First</h3>
              <p className="feature-description">
                All credentials encrypted and stored securely. Your N8N API keys are protected with AES-256 encryption.
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
            Get started in <span className="highlight">under 2 minutes</span>
          </h2>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Create your account</h3>
              <p className="step-description">
                Sign up for free in seconds. No credit card required.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Connect your N8N instance</h3>
              <p className="step-description">
                Enter your N8N URL and API key. We&apos;ll verify the connection instantly.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Start managing workflows</h3>
              <p className="step-description">
                See all your workflows organized by type, with full search, filtering, and editing.
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
            Built for teams who <span className="highlight">love N8N</span>
          </h2>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">💻</div>
              <h3>Access from anywhere</h3>
              <p>Manage your workflows from any device, anywhere. No local setup required.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3>Lightning fast</h3>
              <p>Built with modern React and Next.js. Load hundreds of workflows instantly.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🔓</div>
              <h3>100% open source</h3>
              <p>MIT licensed. Inspect the code, contribute, or fork it for your needs.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">🛡️</div>
              <h3>Secure by default</h3>
              <p>All data encrypted and stored securely. API keys protected with AES-256-GCM.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="section-content">
          <p className="section-label">Pricing</p>
          <h2 className="section-title">
            Start free, then unlock full control <span className="highlight">in the cloud</span>
          </h2>

          <div className="pricing-grid">
            <article className="pricing-card">
              <p className="pricing-tier">Free</p>
              <div className="pricing-value">
                <span className="price-amount">$0</span>
                <span className="price-period">/month</span>
              </div>
              <p className="pricing-description">
                Everything you need to get started: full visibility into your workflows from any device.
              </p>
              <ul className="pricing-features">
                <li>Workflow visibility, search, and filtering</li>
                <li>Cron schedule overview</li>
                <li>Webhook URL quick access</li>
                <li>AI agent dashboard</li>
              </ul>
              <Link href="/signup" className="pricing-button pricing-button-secondary">
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
                Full workflow management in our cloud environment. Edit, bulk-manage, and unlock all AI features.
              </p>
              <ul className="pricing-features">
                <li>Edit workflows directly in WorkflowHQ</li>
                <li>Bulk edit workflows in one place</li>
                <li>All AI features included</li>
                <li>Priority support</li>
              </ul>
              <Link href="/signup" className="pricing-button pricing-button-primary">
                Upgrade to In-Cloud
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to supercharge your N8N workflows?</h2>
          <p className="cta-description">
            Start for free, or choose in-cloud for editing, bulk edits, and all AI features.
          </p>
          <Link href="/signup" className="cta-button">
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
            <p className="footer-tagline">Manage your N8N workflows at a glance</p>
          </div>
          <div className="footer-links">
            <Link href="/signin" className="footer-link">Sign In</Link>
            <Link href="/signup" className="footer-link">Sign Up</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2026 WorkflowHQ. Open source under MIT License.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingScreen
