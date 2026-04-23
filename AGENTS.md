## Learned User Preferences
- Prefer root-cause debugging over symptom-level fixes (for example, rejects timeout-only explanations when integration failures persist).
- Wants hypotheses validated with direct external checks (for example, cURL/API calls outside the app) before concluding.
- Prefers shipping fixes quickly once a plausible fix is ready (often asks to deploy to Vercel during debugging loops).
- Prefers homepage and marketing copy to stay strictly aligned with implemented product behavior; calls out overstated claims quickly.
- Prefers UI polish passes that enforce visual consistency with the rest of the app, especially typography scale, spacing, and control styling.

## Learned Workspace Facts
- Primary deployment target for this workspace is Vercel.
- This workspace integrates with user-hosted n8n instances and retrieves workflows through backend API routes.
- Credentials and connection metadata are stored in Neon/Postgres and used by API handlers.
- Homepage feature visibility is controlled with Vercel Flags (for example, `show-pricing-section`).
- Onboarding depends on a user-provided n8n instance URL plus an API key, and access should be scoped to only required permissions.
