# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WorkflowHQ** — a Next.js 14 cloud app for viewing and managing n8n workflows. Deployed to Vercel with Neon Postgres for auth and credential storage.

## Development Commands

```bash
npm run dev          # Next.js dev server
npm run build        # Next.js build
npm run lint         # ESLint
```

## Environment Setup

Requires `.env.local` (see `.env.example`):
- `NEXT_PUBLIC_NEON_AUTH_URL` — Neon Auth endpoint
- `DATABASE_URL` — Neon Postgres pooler connection string
- `ENCRYPTION_KEY` — 64-char hex string for AES-256-GCM (generate: `openssl rand -hex 32`)

## Architecture

### Auth
- Neon Auth (BetterAuth-based) via `@neondatabase/neon-js/auth`
- Client: `src/lib/auth.ts`
- Server session validation: `lib/auth-helpers.ts` (queries `neon_auth.session` table)

### Database
- Neon Postgres via `lib/db-pool.ts`
- n8n API keys encrypted at rest with AES-256-GCM (`lib/encryption.ts`)
- Encrypted format: `iv:authTag:ciphertext` (hex-encoded)

### API Routes (Next.js App Router)
- `app/api/connection/route.ts` — CRUD user n8n connections
- `app/api/n8n-proxy/route.ts` — proxies requests to user n8n instances
- Handlers in `lib/server/connection-handler.ts` and `lib/server/n8n-proxy-handler.ts`

### Pages
- `/` — marketing landing page (rich content with custom CSS, not Tailwind)
- `/app` — dashboard (workflow list via `@n8n/ui` components)
- `/onboard` — connection setup wizard
- `/settings` — account and connection management
- `/signin`, `/signup`, `/auth/[path]` — auth flows

### Client Code (`src/`)
- `src/screens/` — full-page screen components
- `src/components/` — shared components + `ui/` (shadcn primitives)
- `src/hooks/` — `useAuth`, `useConnection`
- `src/services/n8nProxy.ts` — calls proxy API route
- `src/ui/` — inlined workflow UI library (mapped as `@n8n/ui` via tsconfig paths)

### Workflow UI Library (`src/ui/`)
- Components: WorkflowList, TriggerItem, TriggerSection, FilterBar, SortBar, SearchBar, etc.
- Utils: `workflowParser.ts` (core n8n JSON parsing), `filterTriggers.ts`, `sortTriggers.ts`
- Types: `Workflow`, `TriggerInfo`, `TriggerDetails`, `ConnectedToolInfo`
- Aliased as `@n8n/ui` in tsconfig — import from `@n8n/ui` resolves to `src/ui/index.ts`

## Key Patterns

- **n8n connections use node names, not IDs** — when traversing workflow connections, always use `node.name`
- **n8n data structures vary by version** — parsers have extensive fallback logic
- **AI nodes can appear anywhere** in a workflow, not just as triggers
- **Webhook URLs depend on workflow state** — active: `/webhook/`, inactive: `/webhook-test/`
- **Landing page uses custom CSS** (`src/screens/LandingPage.css`) with scoped CSS variables, not Tailwind
- **ESM throughout** — `"type": "module"`. API route imports need `.js` extensions.

## Deployment

- Deploys to **Vercel** (primary target)
- Database on **Neon** (Postgres)
- Prefer shipping fixes quickly; validate with direct external checks (cURL/API) before concluding root causes
