# Week 1 Foundation & Observability — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the engineering foundation missing from the codebase: observability (Sentry + Pino), error handling architecture, security headers, migrations in git, and the `patient_history` audit table required by Argentine law.

**Architecture:** Sentry captures errors + performance. Pino replaces all `console.error` with structured JSON logs. A centralized `withErrorHandler()` wrapper eliminates per-route try/catch duplication. React error boundaries prevent white screens. Security headers harden the app. The `patient_history` table creates an immutable audit trail for every `clinic_patients` change.

**Tech Stack:** @sentry/nextjs, pino, Next.js 16 App Router, Supabase, TypeScript

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/instrumentation.ts` | Next.js OTel + Sentry server/edge init |
| Create | `sentry.client.config.ts` | Sentry browser SDK config |
| Create | `sentry.server.config.ts` | Sentry Node.js SDK config |
| Create | `sentry.edge.config.ts` | Sentry edge runtime SDK config |
| Modify | `next.config.ts` | `withSentryConfig()` wrapper + security headers |
| Create | `src/lib/logger.ts` | Pino structured logger with child logger factory |
| Create | `src/lib/error-handler.ts` | `withErrorHandler()` centralized API route wrapper |
| Modify | `src/app/api/patients/route.ts` | Migrate to `withErrorHandler()` |
| Modify | `src/app/api/patients/[id]/route.ts` | Migrate to `withErrorHandler()` |
| Modify | `src/app/api/doctors/route.ts` | Migrate to `withErrorHandler()` |
| Modify | `src/app/api/doctors/[id]/route.ts` | Migrate to `withErrorHandler()` |
| Modify | `src/app/api/doctors/[id]/settings/route.ts` | Migrate to `withErrorHandler()` |
| Modify | `src/app/api/doctors/[id]/schedules/route.ts` | Migrate to `withErrorHandler()` |
| Modify | `src/app/api/doctors/[id]/schedules/[scheduleId]/route.ts` | Migrate to `withErrorHandler()` |
| Modify | `src/app/api/doctors/[id]/overrides/route.ts` | Migrate to `withErrorHandler()` |
| Modify | `src/app/api/doctors/[id]/overrides/[overrideId]/route.ts` | Migrate to `withErrorHandler()` |
| Modify | `src/app/api/doctors/[id]/available-slots/route.ts` | Migrate to `withErrorHandler()` |
| Modify | `src/providers/auth-provider.tsx` | Replace `console.error` with Pino logger |
| Create | `src/app/global-error.tsx` | App-level React error boundary |
| Create | `src/app/(dashboard)/error.tsx` | Dashboard route-group error boundary |
| Create | `supabase/migrations/001_baseline.sql` | Pull current schema from production |
| Create | `supabase/migrations/017_create_patient_history.sql` | Audit table + trigger |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Sentry + Pino**

```bash
cd c:/Users/UPCN/OneDrive/Escritorio/turnera
npx @sentry/wizard@latest -i nextjs --org althem --project turnera
```

If the wizard fails or you prefer manual install:

```bash
npm install @sentry/nextjs pino
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('@sentry/nextjs'); console.log('sentry ok')"
node -e "require('pino'); console.log('pino ok')"
```

Expected: Both print "ok" without errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @sentry/nextjs and pino"
```

---

## Task 2: Sentry Configuration Files

**Files:**
- Create: `sentry.client.config.ts`
- Create: `sentry.server.config.ts`
- Create: `sentry.edge.config.ts`
- Create: `src/instrumentation.ts`

- [ ] **Step 1: Create `sentry.client.config.ts`** (project root)

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance: sample 100% in dev, 20% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Session Replay: capture 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration(),
  ],

  // Don't send errors in development
  enabled: process.env.NODE_ENV === "production",
})
```

- [ ] **Step 2: Create `sentry.server.config.ts`** (project root)

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance: sample 100% in dev, 20% in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Don't send errors in development
  enabled: process.env.NODE_ENV === "production",
})
```

- [ ] **Step 3: Create `sentry.edge.config.ts`** (project root)

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  enabled: process.env.NODE_ENV === "production",
})
```

- [ ] **Step 4: Create `src/instrumentation.ts`**

This is the Next.js native instrumentation hook. It loads Sentry configs based on runtime.

```typescript
import * as Sentry from "@sentry/nextjs"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }
}

// Capture errors from Server Components, middleware, and proxies
export const onRequestError = Sentry.captureRequestError
```

- [ ] **Step 5: Verify the app still builds**

```bash
npm run build
```

Expected: Build succeeds. Sentry will warn about missing DSN — that's fine, we'll add it to `.env.local` next.

- [ ] **Step 6: Add Sentry DSN to `.env.local`**

Add this line to `.env.local` (get the DSN from https://sentry.io → Settings → Projects → turnera → Client Keys):

```
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@o123.ingest.us.sentry.io/456
```

If you don't have a Sentry account yet, create one at https://sentry.io (free tier: 5K errors/month). Create an organization "althem" and a project "turnera" (Next.js platform).

- [ ] **Step 7: Commit**

```bash
git add sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts src/instrumentation.ts
git commit -m "feat: add Sentry SDK configuration for client, server, and edge"
```

---

## Task 3: Security Headers + Sentry in `next.config.ts`

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Update `next.config.ts`**

Replace the entire file content:

```typescript
import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  devIndicators: false,

  headers: async () => [
    {
      // Apply to all routes
      source: "/(.*)",
      headers: [
        // Prevent clickjacking — don't allow this site to be embedded in iframes
        { key: "X-Frame-Options", value: "DENY" },
        // Prevent MIME type sniffing — browser must trust the Content-Type header
        { key: "X-Content-Type-Options", value: "nosniff" },
        // Control how much referrer info is sent — full URL only for same-origin
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // Disable browser features we don't use — reduces attack surface
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        // Force HTTPS for 2 years — browsers will refuse HTTP connections
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ],
}

export default withSentryConfig(nextConfig, {
  // Suppress source map upload logs during build
  silent: true,

  // Upload source maps to Sentry for readable stack traces
  // Requires SENTRY_AUTH_TOKEN env var in CI
  org: "althem",
  project: "turnera",

  // Hide source maps from end users (only Sentry can read them)
  hideSourceMaps: true,
})
```

- [ ] **Step 2: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds. Source map upload warnings are OK if `SENTRY_AUTH_TOKEN` isn't set yet.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: add security headers and Sentry webpack config"
```

---

## Task 4: Pino Structured Logger

**Files:**
- Create: `src/lib/logger.ts`

- [ ] **Step 1: Create `src/lib/logger.ts`**

```typescript
import pino from "pino"

/**
 * Structured JSON logger for the entire application.
 *
 * WHY: console.error gives you a string with no context. Pino gives you
 * JSON with timestamps, log levels, and arbitrary context fields.
 * Tools like Grafana Loki can parse and query these structured logs.
 *
 * USAGE:
 *   import { logger } from "@/lib/logger"
 *
 *   // Simple log
 *   logger.info("Server started")
 *
 *   // Log with context (these become JSON fields)
 *   logger.error({ clinicId, userId, error: err.message }, "Failed to create patient")
 *
 *   // Create a child logger for a specific request
 *   const reqLogger = logger.child({ requestId: "abc-123", clinicId: "xyz" })
 *   reqLogger.info("Processing request")  // includes requestId + clinicId automatically
 */
const logger = pino({
  // In development: show human-readable output
  // In production: pure JSON for log aggregation tools
  level: process.env.LOG_LEVEL ?? "info",

  // Add a "service" field to every log line so we can filter
  // Turnera logs from other services in Grafana
  base: {
    service: "turnera-web",
  },

  // Pretty-print in development for readability
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino/file",
      options: { destination: 1 }, // stdout
    },
  }),
})

export { logger }
```

- [ ] **Step 2: Verify it works**

```bash
node -e "const pino = require('pino'); const l = pino({base:{service:'test'}}); l.info({foo:'bar'}, 'hello')"
```

Expected: JSON output with `level`, `time`, `service`, `foo`, `msg` fields.

- [ ] **Step 3: Commit**

```bash
git add src/lib/logger.ts
git commit -m "feat: add Pino structured logger"
```

---

## Task 5: Centralized Error Handler for API Routes

**Files:**
- Create: `src/lib/error-handler.ts`

- [ ] **Step 1: Create `src/lib/error-handler.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { logger } from "@/lib/logger"
import { ZodError } from "zod"

/**
 * Centralized error handler wrapper for API routes.
 *
 * WHY: Without this, every API route has its own try/catch with
 * slightly different error formatting. This wrapper:
 * 1. Catches all errors in one place
 * 2. Classifies them (validation, auth, conflict, server error)
 * 3. Logs them with Pino (structured JSON)
 * 4. Reports them to Sentry (error tracking)
 * 5. Returns a consistent response shape: { error, code, requestId }
 *
 * USAGE:
 *   // Before (duplicated in every route):
 *   export async function GET(request: NextRequest) {
 *     try {
 *       // ... logic
 *     } catch (err) {
 *       return NextResponse.json({ error: err.message }, { status: 500 })
 *     }
 *   }
 *
 *   // After (clean, consistent):
 *   export const GET = withErrorHandler(async (request) => {
 *     // ... logic (just return the response, errors are caught automatically)
 *   })
 */

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

/** Generate a short unique ID for request tracing */
function generateRequestId(): string {
  return crypto.randomUUID().slice(0, 8)
}

/**
 * Custom error class for API errors with HTTP status codes.
 * Throw this from your route handlers to return a specific status code.
 *
 * USAGE:
 *   throw new ApiError("Patient not found", 404, "NOT_FOUND")
 *   throw new ApiError("DNI already exists at this clinic", 409, "CONFLICT")
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR"
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const requestId = generateRequestId()
    const startTime = Date.now()
    const method = request.method
    const url = request.nextUrl.pathname

    try {
      // Execute the actual route handler
      const response = await handler(request, context)

      // Log successful requests
      const duration = Date.now() - startTime
      logger.info(
        { requestId, method, url, status: response.status, duration },
        "API request completed"
      )

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // ── Zod Validation Error ──────────────────────────────────
      if (error instanceof ZodError) {
        logger.warn(
          { requestId, method, url, duration, issues: error.issues },
          "Validation error"
        )
        return NextResponse.json(
          { error: "Validation failed", code: "VALIDATION_ERROR", requestId, details: error.issues },
          { status: 400 }
        )
      }

      // ── Known API Error (thrown intentionally) ────────────────
      if (error instanceof ApiError) {
        logger.warn(
          { requestId, method, url, duration, code: error.code },
          error.message
        )
        return NextResponse.json(
          { error: error.message, code: error.code, requestId },
          { status: error.statusCode }
        )
      }

      // ── Unknown Error (unexpected crash) ──────────────────────
      const message = error instanceof Error ? error.message : "Unknown error"

      logger.error(
        { requestId, method, url, duration, error: message },
        "Unhandled API error"
      )

      // Report to Sentry with request context
      Sentry.captureException(error, {
        tags: { requestId, method, url },
      })

      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR", requestId },
        { status: 500 }
      )
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/error-handler.ts
git commit -m "feat: add centralized withErrorHandler() for API routes"
```

---

## Task 6: Migrate Patients API Routes to `withErrorHandler()`

**Files:**
- Modify: `src/app/api/patients/route.ts`
- Modify: `src/app/api/patients/[id]/route.ts`

This task shows the pattern for migrating ONE route file. The remaining 8 route files follow the exact same pattern.

- [ ] **Step 1: Refactor `src/app/api/patients/route.ts`**

Replace the entire GET function. The key change: remove manual try/catch and `safeParse` error handling — `withErrorHandler()` catches ZodErrors automatically, and we use `.parse()` (which throws) instead of `.safeParse()`.

Replace the GET handler:

Find:
```typescript
export async function GET(request: NextRequest) {
```

Replace with:
```typescript
export const GET = withErrorHandler(async (request: NextRequest) => {
```

At the top of the file, add the import:
```typescript
import { withErrorHandler, ApiError } from "@/lib/error-handler"
```

Inside the GET handler body:
- Replace `const parsed = listSchema.safeParse(params)` + the if-block with just: `const { clinic_id, search, page, limit } = listSchema.parse(params)`
- Remove the `if (!parsed.success)` block entirely — `withErrorHandler` catches ZodError
- Remove `parsed.data` references — use the destructured variables directly
- Keep the Supabase query exactly as-is
- Replace `if (error) { return NextResponse.json({ error: error.message }, { status: 500 }) }` with `if (error) throw new ApiError(error.message, 500, "DB_ERROR")`
- Close the function with `})` instead of `}`

Do the same for the POST handler:
- Replace `export async function POST` with `export const POST = withErrorHandler(async`
- Replace `safeParse` with `parse`
- Remove the validation error if-block
- Replace the `if (existing)` response with `throw new ApiError("Patient with this DNI is already registered at this clinic", 409, "DUPLICATE_DNI")`
- Replace Supabase error responses with `throw new ApiError(...)`
- Close with `})`

- [ ] **Step 2: Refactor `src/app/api/patients/[id]/route.ts`**

Same pattern:
- Add `withErrorHandler` and `ApiError` imports
- Wrap GET and PUT with `withErrorHandler(async (...) => { ... })`
- Replace `safeParse` → `parse`
- Remove manual error if-blocks
- Replace `return NextResponse.json({ error: ... }, { status: N })` with `throw new ApiError(...)` for error cases
- Keep success responses as `return NextResponse.json({ data })`

- [ ] **Step 3: Verify the app builds and patients page works**

```bash
npm run build
```

Then start dev server and test:
```bash
npm run dev
```

Navigate to `http://localhost:3000/dashboard/patients` — the patient list should load correctly.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/patients/route.ts src/app/api/patients/[id]/route.ts
git commit -m "refactor: migrate patients API routes to withErrorHandler()"
```

---

## Task 7: Migrate All Doctor API Routes to `withErrorHandler()`

**Files:**
- Modify: `src/app/api/doctors/route.ts`
- Modify: `src/app/api/doctors/[id]/route.ts`
- Modify: `src/app/api/doctors/[id]/settings/route.ts`
- Modify: `src/app/api/doctors/[id]/schedules/route.ts`
- Modify: `src/app/api/doctors/[id]/schedules/[scheduleId]/route.ts`
- Modify: `src/app/api/doctors/[id]/overrides/route.ts`
- Modify: `src/app/api/doctors/[id]/overrides/[overrideId]/route.ts`
- Modify: `src/app/api/doctors/[id]/available-slots/route.ts`

- [ ] **Step 1: Apply the same pattern from Task 6 to all 8 doctor route files**

For each file:
1. Add `import { withErrorHandler, ApiError } from "@/lib/error-handler"` at the top
2. Wrap each exported handler: `export const GET = withErrorHandler(async (...) => { ... })`
3. Replace `safeParse` → `parse` (let ZodError propagate to wrapper)
4. Replace manual error responses with `throw new ApiError(message, statusCode, code)`
5. Keep success responses unchanged

Important: For routes that use `checkDoctorPermission()`, keep that logic but change how the error is returned:

Before:
```typescript
const perm = await checkDoctorPermission(...)
if (!perm.authorized) {
  return NextResponse.json({ error: perm.error }, { status: perm.status })
}
```

After:
```typescript
const perm = await checkDoctorPermission(...)
if (!perm.authorized) {
  throw new ApiError(perm.error, perm.status, "FORBIDDEN")
}
```

- [ ] **Step 2: Verify build + doctors page**

```bash
npm run build
```

Start dev server, navigate to `http://localhost:3000/dashboard/doctors` — list should load. Click a doctor — detail page should load.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/doctors/
git commit -m "refactor: migrate all doctor API routes to withErrorHandler()"
```

---

## Task 8: Replace `console.error` with Pino Logger

**Files:**
- Modify: `src/providers/auth-provider.tsx`

- [ ] **Step 1: Replace console.error calls in auth-provider.tsx**

There are exactly 3 `console.error` calls in the entire codebase, all in this file.

Add import at the top (after the existing imports):
```typescript
import { logger } from "@/lib/logger"
```

Replace line 112:
```typescript
// Before:
console.error("Failed to load staff record:", staffError?.message)
// After:
logger.error({ error: staffError?.message }, "Failed to load staff record")
```

Replace line 127:
```typescript
// Before:
console.error("Failed to load staff clinics:", clinicsError.message)
// After:
logger.error({ error: clinicsError.message }, "Failed to load staff clinics")
```

Replace line 135:
```typescript
// Before:
console.error("Auth loading failed:", err)
// After:
logger.error({ error: err instanceof Error ? err.message : String(err) }, "Auth loading failed")
```

- [ ] **Step 2: Verify no console.error remains**

```bash
cd c:/Users/UPCN/OneDrive/Escritorio/turnera && grep -r "console.error" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Expected: No results.

- [ ] **Step 3: Commit**

```bash
git add src/providers/auth-provider.tsx
git commit -m "refactor: replace console.error with Pino structured logger"
```

---

## Task 9: React Error Boundaries

**Files:**
- Create: `src/app/global-error.tsx`
- Create: `src/app/(dashboard)/error.tsx`

- [ ] **Step 1: Create `src/app/global-error.tsx`**

This catches fatal errors that crash the entire app (outside any route group). In Next.js App Router, `global-error.tsx` must be a Client Component and must render its own `<html>` and `<body>` tags because it replaces the root layout when triggered.

```tsx
"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

/**
 * Global error boundary — catches fatal errors that crash the entire app.
 *
 * When this renders, something went VERY wrong (the root layout itself broke).
 * It must include <html> and <body> because it replaces the root layout.
 *
 * Sentry automatically captures the error. The user sees a friendly message
 * with a retry button instead of a white screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Something went wrong
          </h1>
          <p className="text-gray-600 max-w-md">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create `src/app/(dashboard)/error.tsx`**

This catches errors within the dashboard route group. Unlike `global-error.tsx`, the sidebar and topbar stay visible — only the main content area shows the error.

```tsx
"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

/**
 * Dashboard error boundary — catches errors in any dashboard page.
 *
 * The sidebar and topbar remain visible (they're in the layout above this).
 * Only the main content area shows the error message.
 * Sentry captures the error automatically.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Something went wrong
        </h2>
        <p className="text-gray-600 max-w-md">
          There was an error loading this page. Our team has been notified.
        </p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/global-error.tsx src/app/(dashboard)/error.tsx
git commit -m "feat: add React error boundaries (global + dashboard)"
```

---

## Task 10: Pull Migrations into Git

**Files:**
- Create: `supabase/migrations/001_baseline.sql`

- [ ] **Step 1: Pull the current production schema**

This extracts the current database schema as a single SQL file. It captures all 16 tables, functions, triggers, RLS policies, and indexes.

```bash
cd c:/Users/UPCN/OneDrive/Escritorio/turnera
npx supabase db pull --schema public
```

Expected: Creates a file in `supabase/migrations/` with a timestamped name like `20260401120000_remote_schema.sql`.

- [ ] **Step 2: Rename to `001_baseline.sql`**

```bash
cd c:/Users/UPCN/OneDrive/Escritorio/turnera/supabase/migrations
mv *_remote_schema.sql 001_baseline.sql 2>/dev/null || mv *.sql 001_baseline.sql
```

If the file has a different name, just rename whatever was created to `001_baseline.sql`.

- [ ] **Step 3: Verify the file contains the schema**

```bash
head -50 c:/Users/UPCN/OneDrive/Escritorio/turnera/supabase/migrations/001_baseline.sql
```

Expected: SQL statements creating tables (`clinics`, `staff`, `clinic_patients`, etc.).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/001_baseline.sql
git commit -m "chore: pull production schema as baseline migration"
```

---

## Task 11: Create `patient_history` Audit Table

**Files:**
- Create: `supabase/migrations/017_create_patient_history.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/017_create_patient_history.sql`:

```sql
-- Migration 017: Create patient_history audit table
--
-- WHY: Argentine Ley 26.529 (Patient Rights) mandates an immutable audit trail
-- for all modifications to patient data. Every create, update, and delete on
-- clinic_patients must be logged with: who did it, when, what changed.
--
-- This table is INSERT-ONLY. No UPDATE or DELETE policies exist.
-- Records must be retained for 10 years (legal requirement).

-- ─── Table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patient_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which patient was modified
  patient_id UUID NOT NULL REFERENCES clinic_patients(id) ON DELETE CASCADE,

  -- Denormalized for RLS performance (avoids joining clinic_patients on every read)
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- What happened: 'created', 'updated', 'deleted'
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),

  -- Full snapshot of the record before and after the change
  old_values JSONB,        -- null on 'created'
  new_values JSONB,        -- null on 'deleted'

  -- Which specific fields changed (quick scan without diffing JSONB)
  changed_fields TEXT[],

  -- Who made the change (staff member)
  performed_by UUID REFERENCES staff(id),

  -- Their role at the time of the change
  performed_by_role TEXT,

  -- IP address for security audits
  ip_address TEXT,

  -- When the change happened
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────

CREATE INDEX idx_patient_history_patient_id ON patient_history(patient_id);
CREATE INDEX idx_patient_history_clinic_id ON patient_history(clinic_id);
CREATE INDEX idx_patient_history_created_at ON patient_history(created_at);

-- ─── RLS ────────────────────────────────────────────────────────────
-- Same pattern as all other per-clinic tables.
-- SELECT only — no UPDATE or DELETE allowed (immutable audit log).

ALTER TABLE patient_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view audit logs for their clinics"
  ON patient_history
  FOR SELECT
  USING (clinic_id = ANY(get_user_clinic_ids()));

-- INSERT policy for the trigger (runs as SECURITY DEFINER, but we add
-- a policy for service_role and authenticated inserts via trigger)
CREATE POLICY "System can insert audit logs"
  ON patient_history
  FOR INSERT
  WITH CHECK (clinic_id = ANY(get_user_clinic_ids()));

-- ─── Trigger Function ──────────────────────────────────────────────
-- Automatically logs every INSERT, UPDATE, DELETE on clinic_patients.

CREATE OR REPLACE FUNCTION log_patient_change()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_old JSONB;
  v_new JSONB;
  v_changed TEXT[];
  v_key TEXT;
  v_staff_id UUID;
  v_staff_role TEXT;
BEGIN
  -- Determine the action
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_changed := ARRAY[]::TEXT[];
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    -- Calculate which fields actually changed
    v_changed := ARRAY[]::TEXT[];
    FOR v_key IN SELECT jsonb_object_keys(v_new)
    LOOP
      IF v_old ->> v_key IS DISTINCT FROM v_new ->> v_key THEN
        v_changed := v_changed || v_key;
      END IF;
    END LOOP;
    -- Skip if nothing actually changed
    IF array_length(v_changed, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_changed := ARRAY[]::TEXT[];
  END IF;

  -- Try to get the current staff member (may be NULL for service_role operations)
  BEGIN
    SELECT s.id INTO v_staff_id
    FROM staff s
    WHERE s.auth_user_id = auth.uid();

    IF v_staff_id IS NOT NULL THEN
      SELECT sc.role::TEXT INTO v_staff_role
      FROM staff_clinics sc
      WHERE sc.staff_id = v_staff_id
        AND sc.clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
      LIMIT 1;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- auth.uid() may fail in service_role context — that's fine
    v_staff_id := NULL;
    v_staff_role := NULL;
  END;

  -- Insert the audit record
  INSERT INTO patient_history (
    patient_id,
    clinic_id,
    action,
    old_values,
    new_values,
    changed_fields,
    performed_by,
    performed_by_role
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.clinic_id, OLD.clinic_id),
    v_action,
    v_old,
    v_new,
    v_changed,
    v_staff_id,
    v_staff_role
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Attach Trigger ─────────────────────────────────────────────────

CREATE TRIGGER trg_log_patient_change
  AFTER INSERT OR UPDATE OR DELETE ON clinic_patients
  FOR EACH ROW
  EXECUTE FUNCTION log_patient_change();
```

- [ ] **Step 2: Apply the migration to production**

```bash
cd c:/Users/UPCN/OneDrive/Escritorio/turnera
npx supabase db push --project-ref lavfzixecvbvdqxyiwwl
```

Expected: Migration applies successfully. Output should say something like "Applied migration 017_create_patient_history.sql".

- [ ] **Step 3: Verify the table exists**

```bash
npx supabase db execute --project-ref lavfzixecvbvdqxyiwwl "SELECT count(*) FROM patient_history"
```

Expected: Returns `0` (empty table, no patient changes logged yet).

- [ ] **Step 4: Test the trigger fires**

```bash
npx supabase db execute --project-ref lavfzixecvbvdqxyiwwl "
  -- Update a patient to trigger the audit log
  UPDATE clinic_patients SET notes = 'audit test' WHERE id = (SELECT id FROM clinic_patients LIMIT 1);
  -- Check the audit log
  SELECT action, changed_fields, created_at FROM patient_history ORDER BY created_at DESC LIMIT 1;
"
```

Expected: One row with `action = 'updated'`, `changed_fields` containing `{notes}`.

- [ ] **Step 5: Regenerate TypeScript types**

```bash
npx supabase gen types typescript --project-id lavfzixecvbvdqxyiwwl > src/lib/types/database.ts
```

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/017_create_patient_history.sql src/lib/types/database.ts
git commit -m "feat: add patient_history audit table with trigger (Ley 26.529 compliance)"
```

---

## Task 12: Verify Next.js CVE-2025-29927 Patch

**Files:** None (verification only)

- [ ] **Step 1: Check Next.js version**

```bash
cd c:/Users/UPCN/OneDrive/Escritorio/turnera && node -e "console.log(require('next/package.json').version)"
```

Expected: `16.2.1`. This version is well past the patched versions (14.2.25, 15.2.3), so Next.js 16.x is NOT affected.

- [ ] **Step 2: Document the check**

No action needed. Next.js 16.2.1 is safe. The vulnerability only affected versions <14.2.25 and 15.x <15.2.3.

---

## Task 13: Final Verification

- [ ] **Step 1: Full build**

```bash
cd c:/Users/UPCN/OneDrive/Escritorio/turnera && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Verify no console.error remains**

```bash
grep -r "console.error" src/ --include="*.ts" --include="*.tsx"
```

Expected: No results.

- [ ] **Step 3: Verify Sentry config files exist**

```bash
ls -la sentry.*.config.ts src/instrumentation.ts
```

Expected: 4 files listed.

- [ ] **Step 4: Verify migrations are tracked**

```bash
ls supabase/migrations/
```

Expected: `001_baseline.sql` and `017_create_patient_history.sql`.

- [ ] **Step 5: Verify error boundaries exist**

```bash
ls src/app/global-error.tsx src/app/\(dashboard\)/error.tsx
```

Expected: Both files exist.

- [ ] **Step 6: Verify security headers**

```bash
npm run dev &
sleep 3
curl -sI http://localhost:3000 | grep -E "X-Frame|X-Content|Strict-Transport|Referrer-Policy|Permissions-Policy"
kill %1
```

Expected: All 5 security headers present in the response.

- [ ] **Step 7: Start dev server and smoke test**

```bash
npm run dev
```

Navigate to:
1. `http://localhost:3000/login` — should load
2. Log in → `http://localhost:3000/dashboard` — should load
3. `http://localhost:3000/dashboard/patients` — patient list should load
4. `http://localhost:3000/dashboard/doctors` — doctor list should load

All pages should work as before, with no regressions.
