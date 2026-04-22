## Learned User Preferences
- Prefer root-cause debugging over symptom-level fixes (for example, rejects timeout-only explanations when integration failures persist).
- Wants hypotheses validated with direct external checks (for example, cURL/API calls outside the app) before concluding.
- Prefers shipping fixes quickly once a plausible fix is ready (often asks to deploy to Vercel during debugging loops).

## Learned Workspace Facts
- Primary deployment target for this workspace is Vercel.
- This workspace integrates with user-hosted n8n instances and retrieves workflows through backend API routes.
- Credentials and connection metadata are stored in Neon/Postgres and used by API handlers.
