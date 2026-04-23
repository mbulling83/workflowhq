## Learned User Preferences
- Prefer root-cause debugging over symptom-level fixes (for example, rejects timeout-only explanations when integration failures persist).
- Wants hypotheses validated with direct external checks (for example, cURL/API calls outside the app) before concluding.
- Prefers shipping fixes quickly once a plausible fix is ready (often asks to deploy to Vercel during debugging loops).
- Prefers homepage and marketing copy to stay strictly aligned with implemented product behavior; calls out overstated claims quickly.

## Learned Workspace Facts
- Primary deployment target for this workspace is Vercel.
- This workspace integrates with user-hosted n8n instances and retrieves workflows through backend API routes.
- Credentials and connection metadata are stored in Neon/Postgres and used by API handlers.
- Homepage feature visibility is controlled with Vercel Flags (for example, `show-pricing-section`).
