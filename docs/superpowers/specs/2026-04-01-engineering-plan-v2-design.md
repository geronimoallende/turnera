# Turnera — Engineering Plan v2

**Date**: 2026-04-01
**Status**: Approved
**Supersedes**: Original `docs/plan.md` (feature-only plan with 12 tables, n8n, no observability)

This spec defines the complete engineering plan for Turnera: architecture-first, with cross-cutting concerns addressed before features. Informed by 33 deep research sessions, UPCN legacy system analysis (61 screenshots + field visit), and web research on medical SaaS best practices.

---

## 1. Context & Strategic Principles

**Turnera** is a multi-tenant medical appointment scheduling SaaS built by Althem Group. First client: UPCN (5,327 patients, 20+ doctors, 84 insurance plans). The system replaces a legacy web app running on `10.11.12.250` with broken financial tracking, no duplicate prevention, and minimal clinical history.

**Strategic principles derived from research:**

1. **Secretary-first UX** — The secretary books 40-80 appointments/day. Every booking must complete in <30 seconds or the system gets rejected. 2-week adoption window.
2. **WhatsApp is THE patient channel** — 93% penetration in Argentina, 31.4 hrs/month usage, 98% open rate. No web booking portal for MVP. Patients interact via WhatsApp only.
3. **Compliance from Day 1** — Ley 25.326 (data protection) + Ley 26.529 (patient rights) + Disposicion 11/2006 (security measures). Health data = CRITICAL level. 10-year retention. Audit trails are legally mandatory, not optional.
4. **Fix the rendicion** — The legacy system's biggest pain point: order numbers don't link to coseguro amounts, causing doctor disputes. Fixing this properly is the competitive advantage.
5. **Offline-aware architecture** — 47% of Argentine clinics have unstable internet. Design patterns must support offline from the start, even if full PWA comes later.
6. **No integrated competitor** — Nobody offers turnos + PACS + obras sociales + AI dictation + patient portal. This gap is the moat.

**Key architecture decisions (already made):**
- Multi-tenant via `clinic_id` + RLS on every per-clinic table
- Clinic-owned patients (`clinic_patients`, no global table, DNI unique per clinic)
- Staff-only auth (admin/doctor/secretary). Patients never log in.
- Python/FastAPI backend for AI/WhatsApp/reminders (supersedes n8n — ADR-012)
- Database triggers as source of truth (both Next.js and FastAPI respect them)

**Supabase project:** `lavfzixecvbvdqxyiwwl` (`https://lavfzixecvbvdqxyiwwl.supabase.co`)

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 16 (App Router) + TypeScript strict | Verify patched for CVE-2025-29927 |
| **UI** | shadcn/ui + Tailwind CSS 4 + Lucide icons | Sober blue/white flat design |
| **Calendar** | @fullcalendar/react 6.x | Day/week/month views |
| **Forms** | react-hook-form + zod | All inputs validated |
| **Data Fetching** | React Query (TanStack Query v5) | Offline persistence via `persistQueryClient` |
| **Charts** | recharts | Dashboard analytics |
| **PDF** | @react-pdf/renderer | Agenda export, reports |
| **Dates** | date-fns + date-fns-tz | Timezone: America/Argentina/Buenos_Aires |
| **Toasts** | Sonner | User feedback |
| **Database** | Supabase (PostgreSQL + RLS + Auth + Realtime) | Pro plan + PITR add-on for production |
| **AI Backend** | FastAPI + LangChain on Hetzner VPS (Docker) | WhatsApp chatbot, RAG, reminders, AI agent |
| **Task Queue** | Celery + Redis | Scheduled reminders, async processing |
| **RAG** | pgvector in Supabase + LangChain | Clinic-scoped embeddings |
| **WhatsApp** | YCloud BSP → FastAPI webhook | Plan for BSUID migration (June 2026) |
| **Observability** | Sentry + OpenTelemetry + Grafana Cloud | Errors + traces + metrics + logs from Day 1 |
| **Structured Logging** | Pino (Next.js) + structlog (Python) | Replace all console.error |
| **Rate Limiting** | @upstash/ratelimit + Upstash Redis | Edge middleware, per-tenant keys |
| **Error Tracking** | @sentry/nextjs + sentry-sdk[fastapi] | Auto-instrumentation both services |
| **Testing** | pgTAP (RLS) + Vitest (API) + Playwright (E2E) + k6 (load) | 4 layers |
| **CI/CD** | GitHub Actions | Lint → typecheck → test → migrate → deploy |
| **Hosting** | Vercel (frontend) + Hetzner VPS (Python) + Supabase (DB) | 3 environments: dev/staging/prod |
| **Offline** | React Query persistence + Serwist (Phase 3) | Architecture-ready from Day 1, PWA later |

**What changed from the old plan:**
- n8n → Python/FastAPI (ADR-012)
- No observability → Sentry + OTel + Grafana Cloud from Day 1
- No testing → 4-layer testing strategy
- No CI/CD → GitHub Actions pipeline
- No rate limiting → Upstash at edge
- No structured logging → Pino + structlog
- "Push to main" deploys → 3 environments with staging gate
- Daily backups → PITR (second-level granularity)

---

## 3. Architecture & Cross-Cutting Concerns

### 3.1 Environment Strategy

```
┌─────────────┬──────────────────────┬───────────────────────┬─────────────────────┐
│             │ Development          │ Staging               │ Production          │
├─────────────┼──────────────────────┼───────────────────────┼─────────────────────┤
│ Frontend    │ localhost:3000       │ Vercel Preview        │ Vercel Production   │
│ Database    │ supabase start       │ Supabase Branch       │ Supabase Main       │
│ Python API  │ localhost:8000       │ VPS staging container │ VPS prod container  │
│ Triggers    │ PR opens             │ PR merge to staging   │ PR merge to main    │
│ Data        │ Seed script          │ Anonymized prod copy  │ Real data           │
│ Secrets     │ .env.local           │ Vercel env vars       │ Vercel env vars     │
└─────────────┴──────────────────────┴───────────────────────┴─────────────────────┘
```

- **Local dev**: `supabase start` runs a local PostgreSQL. All migrations tested here first. Never develop against production.
- **Staging**: Supabase Branching creates ephemeral databases per PR. Vercel preview deployments auto-connect to the branch. Migrations run automatically on PR push.
- **Production**: Only receives code through merged PRs. Migrations run via GitHub Actions, never from local machines. PITR enabled.
- **Migrations in git**: All migrations must live in `supabase/migrations/`. Current applied-but-not-tracked migrations need to be pulled down with `supabase db pull` or recreated.

### 3.2 CI/CD Pipeline

```
PR opened/pushed:
  ├── [parallel] ESLint + TypeScript typecheck
  ├── [parallel] Vitest unit/integration tests
  ├── [parallel] pgTAP RLS tests (supabase test db)
  ├── [sequential] Supabase branch created → migrations applied
  ├── [sequential] Vercel preview deployed
  └── [sequential] Playwright E2E against preview URL

PR merged to main:
  ├── [sequential] supabase db push --project-ref (production migration)
  ├── [sequential] Health check: verify migration applied
  ├── [sequential] Vercel production deploy
  └── [sequential] Sentry release + source maps upload

Rollback:
  - Never delete or edit applied migrations
  - Write a NEW migration that reverses changes
  - Vercel: instant rollback to previous deployment
  - Supabase: PITR restore as last resort
```

### 3.3 Observability (Day 1)

```
Browser ──→ Vercel (Next.js) ──→ Supabase ←── FastAPI (VPS)
  │              │                                │
  │         @sentry/nextjs                   sentry-sdk
  │         @vercel/otel                     otel-fastapi
  │              │                                │
  │              ▼                                ▼
  │         OTel Collector ◄──────────────────────┘
  │              │
  │         ┌────┼────────────┐
  │         ▼    ▼            ▼
  │       Tempo  Loki     Prometheus
  │      (traces)(logs)   (metrics)
  │         └────┼────────────┘
  │              ▼
  │           Grafana (dashboards + alerts)
  │
  └──→ Sentry (errors + performance + releases)
```

**What we instrument from Day 1:**

| Signal | What | Tool |
|--------|------|------|
| **Errors** | Unhandled exceptions, failed API calls, auth failures | Sentry |
| **Traces** | Full request lifecycle: browser → API → Supabase → response | OTel → Tempo |
| **Metrics** | API latency (p50/p95/p99), error rates by route, active users | OTel → Prometheus |
| **Logs** | Structured JSON logs with request ID, clinic_id, user_id, action | Pino/structlog → Loki |
| **Business** | Appointments/day, no-show rate, booking source breakdown, active clinics | Custom metrics → Grafana |

**Alerts (initial set):**
- Error rate > 5% on any API route for 5 minutes
- API p99 latency > 3 seconds
- Auth failure spike (> 10 failures/minute from same IP)
- Zero appointments booked in 2 hours during business hours (system might be down)
- WhatsApp delivery failure rate > 20%

**Implementation:**
- `instrumentation.ts` at project root (Next.js native OTel support)
- Pino logger replaces all `console.error` — structured JSON with `{ requestId, clinicId, userId, action, duration }`
- Sentry release tracking with source maps (uploaded in CI)
- Grafana dashboards: one for engineering (latency, errors, traces), one for business (appointments, no-shows, active clinics)

### 3.4 Error Handling Architecture

```
┌─────────────────────────────────────────────────────┐
│ CLIENT (React)                                       │
│                                                      │
│  global-error.tsx ← catches fatal React errors       │
│  error.tsx (per route) ← catches route-level errors  │
│  React Query onError ← handles API fetch failures    │
│  Sonner toasts ← user-facing feedback                │
│  Sentry.captureException ← auto via SDK              │
└──────────────────────┬──────────────────────────────┘
                       │ fetch
                       ▼
┌─────────────────────────────────────────────────────┐
│ API ROUTES (Next.js)                                 │
│                                                      │
│  withErrorHandler() wrapper ← centralized try/catch  │
│    ├── Zod validation errors → 400 + details         │
│    ├── Auth errors → 401/403                         │
│    ├── Not found → 404                               │
│    ├── Conflict (overlap, duplicate) → 409           │
│    ├── Supabase errors → 500 + logged                │
│    └── Unknown errors → 500 + Sentry alert           │
│                                                      │
│  Every error response: { error, code, requestId }    │
└──────────────────────┬──────────────────────────────┘
                       │ query
                       ▼
┌─────────────────────────────────────────────────────┐
│ DATABASE (Supabase)                                  │
│                                                      │
│  Triggers → raise exception (overlap, payment auth)  │
│  RLS → silent filter (returns 0 rows, not error)     │
│  Constraints → unique violation, FK violation         │
└─────────────────────────────────────────────────────┘
```

- **No per-route try/catch duplication.** A single `withErrorHandler(handler)` wrapper for all API routes handles logging, error classification, request ID injection, and Sentry capture.
- **Error responses are consistent**: always `{ error: string, code: string, requestId: string }` so the client can handle them uniformly.
- **React error boundaries**: `global-error.tsx` at app level, `error.tsx` per route group. Both show a friendly message + "retry" button, and auto-report to Sentry.
- **React Query retry**: 1 retry for network errors, 0 retries for 4xx (client errors don't improve by retrying).

### 3.5 Security Model

**Layer 1: Transport & Headers**
- HTTPS enforced (Vercel default)
- Security headers in `next.config.ts`: CSP (nonce-based), X-Frame-Options DENY, HSTS, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy
- Verify Next.js version is patched for CVE-2025-29927

**Layer 2: Authentication**
- Supabase Auth (email/password) for staff only
- JWT in httpOnly cookies (already implemented via `@supabase/ssr`)
- Session refresh on every request (proxy.ts middleware)
- `clinic_id` always derived from JWT/session, never trusted from client params

**Layer 3: Authorization**
- RLS policies filter by `clinic_id = ANY(get_user_clinic_ids())`
- API route role checks via `checkDoctorPermission()` (admin/doctor/secretary)
- Database triggers enforce business rules (payment permissions, overlap prevention)
- pgTAP tests verify all RLS policies in CI

**Layer 4: Rate Limiting**
- `@upstash/ratelimit` in edge middleware (runs before API routes)
- Keying strategy:
  - Public routes (login): by IP, 5 requests/minute
  - Authenticated reads: by `userId:clinicId`, 100 requests/minute
  - Authenticated writes: by `userId:clinicId`, 30 requests/minute
- Returns 429 with `Retry-After` header

**Layer 5: Input Validation**
- Zod schemas on every API route (already implemented)
- Parameterized queries via Supabase SDK (no raw SQL injection risk)
- DNI/phone format sanitization at API boundary

**Layer 6: Secrets**
- `.env.local` for development only
- Vercel encrypted environment variables for staging/production
- Per-clinic secrets (WhatsApp BSP credentials) encrypted in `clinics` table
- `service_role` key only used in `admin.ts` — never exposed to client

### 3.6 Testing Strategy (4 Layers)

| Layer | Tool | What It Tests | Runs In |
|-------|------|---------------|---------|
| **Database** | pgTAP | RLS policies, triggers, functions (`get_available_slots`, overlap check) | CI (every PR) |
| **API** | Vitest | Route handlers with mocked auth contexts (admin/doctor/secretary/unauth) | CI (every PR) |
| **E2E** | Playwright | Critical user flows against preview deployment | CI (every PR) |
| **Load** | k6 | Concurrent bookings, slot calculation under load | Manual (pre-release) |

**Critical test scenarios:**
1. Tenant A cannot see Tenant B's patients (RLS)
2. Doctor cannot mark payment status (trigger)
3. Duplicate booking prevention under concurrent requests (overlap trigger + race condition)
4. Secretary creates appointment in <30 seconds (E2E performance)
5. Auth bypass attempt with `x-middleware-subrequest` header (security)
6. Expired JWT redirects to login (auth flow)

### 3.7 Performance Budgets

| Metric | Target | Why |
|--------|--------|-----|
| Booking flow (click to confirmed) | < 3 seconds | Secretary needs <30s total, UI interaction + API must be fast |
| API route response (p95) | < 500ms | Supabase queries + RLS overhead |
| API route response (p99) | < 1.5s | Acceptable worst case |
| `get_available_slots` RPC | < 200ms | Called frequently during booking |
| Page initial load (LCP) | < 2.5s | Vercel + React Server Components |
| Time to Interactive (TTI) | < 3.5s | Secretary starts working fast |
| Calendar render (week view, 5 doctors) | < 1s | Most used view |

Measured via: Sentry Performance (Web Vitals) + OTel traces + Grafana dashboards. Alerts fire when budgets are exceeded for >5 minutes.

### 3.8 Legal Compliance Architecture

**Audit Trail (Ley 26.529 mandate):**

| Table | Audit Mechanism |
|-------|----------------|
| `appointments` | `appointment_history` table (already exists) — immutable log of every change |
| `clinic_patients` | **NEW**: `patient_history` table — log every create/update/delete with old_values, new_values, performed_by |
| `doctor_schedules` | Logged via application-level audit (low sensitivity) |
| `staff_clinics` | Logged via application-level audit (role changes are security events) |

- Every audit record includes: `user_id`, `action`, `old_values`, `new_values`, `ip_address`, `timestamp`
- Audit tables have **no UPDATE or DELETE policies** — insert-only, immutable
- 10-year retention on all audit tables (Supabase PITR + periodic exports to cold storage)

**Personal Data Security Document (Disposicion 11/2006):**
- Must be written before production launch
- Describes: data classification, access controls, encryption, audit logging, backup procedures, incident response
- Stored in `docs/compliance/personal-data-security-document.md`

**Encryption:**
- At rest: Supabase default (AES-256 on disk)
- In transit: TLS 1.2+ (Vercel + Supabase default)
- Per-clinic secrets: encrypted columns for WhatsApp credentials

### 3.9 Backup & Disaster Recovery

| Parameter | Target |
|-----------|--------|
| **RPO** (max data loss) | < 1 minute (PITR) |
| **RTO** (max downtime) | < 1 hour |
| **Retention** | 10 years for clinical data (legal) |

**Strategy:**
- **PITR** enabled on Supabase Pro plan — second-level restore granularity
- **Quarterly restore test**: restore PITR to a new project, run validation queries, compare row counts, delete test project
- **Long-term archive**: yearly export of audit tables to encrypted cold storage (S3 or equivalent) for 10-year compliance
- **Runbook**: documented step-by-step restore procedure in `docs/runbooks/disaster-recovery.md`
- **Vercel**: instant rollback to previous deployment (no data risk)
- **FastAPI VPS**: Docker images tagged per release, rollback = `docker-compose up` with previous tag

### 3.10 Offline-Aware Architecture

We don't build full PWA in Phase 1, but we **design the patterns** so it's not a painful retrofit later.

**Phase 1 (architecture only, no PWA):**
- React Query configured with `gcTime: Infinity` for critical data (today's appointments, doctor list)
- All mutations use optimistic updates (UI updates immediately, rolls back on error)
- Every API response includes `requestId` for idempotency tracking
- State management assumes network can fail at any moment

**Phase 3 (PWA build):**
- Serwist service worker for static asset caching
- React Query `persistQueryClient` → IndexedDB for offline read
- Mutation queue: failed writes stored in IndexedDB, retried when online
- **Never cache patient PII offline** — only schedule/calendar data
- Conflict resolution: server timestamp wins, user prompted if conflict detected

### 3.11 Data Migration Strategy (UPCN Legacy)

```
Phase A: Profiling (before writing migration code)
  ├── Export legacy data (CSV or direct DB access — pending)
  ├── Profile: null rates, duplicates, encoding, format issues
  ├── Map: legacy fields → turnera schema (field-by-field document)
  └── Flag: data quality issues for manual review

Phase B: Transformation
  ├── DNI: strip dots (XX.XXX.XXX → XXXXXXXX), validate length
  ├── Phones: normalize to +54 format
  ├── Insurance: map 84 legacy plans → clinic_services/insurance fields
  ├── Doctors: map 20+ legacy doctors → doctors + staff + doctor_clinic_settings
  ├── Prestaciones: map 18 service types → clinic_services
  └── Appointments: historical only (read-only import)

Phase C: Parallel Run
  ├── Import data to Turnera staging
  ├── Run both systems simultaneously for 1-2 weeks
  ├── Secretaries book in BOTH systems (catch discrepancies)
  ├── Validation gates: daily row count comparison
  └── Go/no-go decision after parallel period

Phase D: Cutover
  ├── Final delta import (new data since last sync)
  ├── Legacy system → read-only mode
  ├── Turnera → primary system
  └── Legacy data retained for 10 years (legal)
```

### 3.12 Cost Projection

| Service | Free Tier | Phase 1 (1 clinic) | Phase 2 (5 clinics) | Phase 3 (10+ clinics) |
|---------|-----------|--------------------|--------------------|----------------------|
| Supabase Pro + PITR | — | $25 + $10 = $35/mo | $35/mo | $35/mo (until 50+ clinics) |
| Vercel Pro | — | $20/mo | $20/mo | $20/mo |
| Hetzner VPS (FastAPI) | — | $5/mo (CX22) | $10/mo (CX32) | $20/mo (CX42) |
| Sentry | 5K errors free | $0 | $0 | $26/mo |
| Grafana Cloud | 50GB logs free | $0 | $0 | $0 |
| Upstash Redis | 10K req/day free | $0 | $0 | $10/mo |
| WhatsApp (YCloud) | 1K conversations | $5/mo | $25/mo | $50/mo |
| Claude API (LLM) | — | $10/mo | $30/mo | $60/mo |
| **Total** | | **~$75/mo** | **~$120/mo** | **~$221/mo** |

---

## 4. Database Schema (17 Tables)

### Architecture: Global vs Per-Clinic

```
┌─────────────────────────────────────────────────────┐
│ GLOBAL (shared across clinics)                      │
│   staff (identity: auth_user_id, name, email)       │
│   doctors (specialty, license_number)               │
├─────────────────────────────────────────────────────┤
│ JUNCTION (per-clinic metadata for global entities)  │
│   staff_clinics (role per clinic)                   │
│   doctor_clinic_settings (fee, slots, overbooking)  │
├─────────────────────────────────────────────────────┤
│ PER-CLINIC (always have clinic_id)                  │
│   clinics, clinic_patients, appointments,           │
│   doctor_schedules, schedule_overrides, waitlist,   │
│   reminders, appointment_history, patient_history,  │
│   clinic_faqs, clinic_services,                     │
│   document_embeddings, conversation_sessions        │
└─────────────────────────────────────────────────────┘
```

### Tables 1-16 (existing)

1. `clinics` — tenant config + WhatsApp BSP credentials
2. `staff` — staff identity (global)
3. `staff_clinics` — staff ↔ clinic + role (junction)
4. `doctors` — doctor profile (global)
5. `doctor_clinic_settings` — per-clinic doctor config (junction)
6. `clinic_patients` — all patient data per clinic (personal info + metadata, blacklist, CRM)
7. `doctor_schedules` — weekly recurring availability
8. `schedule_overrides` — one-off exceptions (vacations, sick days)
9. `appointments` — core table
10. `waitlist` — patients waiting for openings
11. `appointment_history` — immutable audit log for appointments
12. `reminders` — outbound communication tracking
13. `clinic_faqs` — admin-managed FAQ entries per clinic (for RAG)
14. `clinic_services` — services offered per clinic (for RAG + future billing)
15. `document_embeddings` — pgvector store for RAG (clinic-scoped embeddings)
16. `conversation_sessions` — completed WhatsApp conversations (analytics)

### Table 17: `patient_history` (NEW — Legal Compliance)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| patient_id | UUID FK → clinic_patients | |
| clinic_id | UUID FK → clinics | Denormalized for RLS performance |
| action | TEXT NOT NULL | 'created', 'updated', 'deleted' |
| old_values | JSONB | Previous state (null on create) |
| new_values | JSONB | New state (null on delete) |
| changed_fields | TEXT[] | Which fields changed (quick scan without diffing JSONB) |
| performed_by | UUID FK → staff | Who made the change |
| performed_by_role | TEXT | Role at time of change (admin/secretary/doctor) |
| ip_address | TEXT | For security audits |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**RLS**: SELECT where `clinic_id = ANY(get_user_clinic_ids())`. No UPDATE or DELETE policies — insert-only, immutable.

**Trigger**: `AFTER INSERT OR UPDATE OR DELETE ON clinic_patients` → auto-inserts into `patient_history`.

### Schema Modifications to Existing Tables

**`clinics` — WhatsApp BSP + BSUID-ready:**

| New Column | Type | Notes |
|------------|------|-------|
| whatsapp_bsp_provider | TEXT DEFAULT 'ycloud' | Which BSP |
| whatsapp_bsp_api_key | TEXT | Encrypted — BSP API credentials |
| whatsapp_bsuid_enabled | BOOLEAN DEFAULT false | Ready for Meta BSUID migration (June 2026) |

**`clinic_patients` — BSUID field:**

| New Column | Type | Notes |
|------------|------|-------|
| whatsapp_bsuid | TEXT | Business-Scoped User ID (Meta, June 2026) |

**`appointments` — Entreturnos + Rendicion:**

| New Column | Type | Notes |
|------------|------|-------|
| is_entreturno | BOOLEAN DEFAULT false | Squeeze-in between existing slots |
| coseguro_amount | DECIMAL(10,2) | Amount charged at arrival (from FEMER order) |
| order_number | TEXT | FEMER order number — FK to rendicion |

**`appointments` — Status enum (9 → 11):**

Added:
- `otorgado` — granted/assigned, pre-confirmation state (initial when secretary assigns)
- `cancelled_clinic` — cancelled by medical center (distinct from patient or doctor cancel)

**Status flow:**

```
otorgado → confirmed → arrived → in_progress → completed
    │          │          │
    │          │          └→ no_show
    │          │
    ├→ cancelled_patient
    ├→ cancelled_doctor
    ├→ cancelled_clinic
    └→ rescheduled
```

### New Database Functions

**`get_rendicion_summary(clinic_id, doctor_id, date_start, date_end)`** — Returns financial reconciliation with proper FK relationships: order_number, appointment_date, patient_name, obra_social, coseguro_amount, payment_status, doctor_name.

**`get_available_slots` updated** — Now returns `can_entreturno` flag for gaps between booked appointments where a squeeze-in is possible. Respects `allows_overbooking` setting.

### Migrations Strategy

1. Run `supabase db pull` → commit as `001_baseline.sql`
2. New migrations:
   - `017_create_patient_history.sql`
   - `018_add_entreturno_rendicion.sql`
   - `019_add_bsuid_fields.sql`
   - `020_create_rendicion_function.sql`

---

## 5. Implementation Phases

### Phase 1: Core MVP (Weeks 1-6)

**Week 1: Foundation + Observability** (partially done)

Done:
- [x] Next.js project + Supabase + Auth + Login page
- [x] 16 database migrations applied
- [x] Seed script (1 clinic, 3 doctors, 50 patients, 200 appointments)

Remaining:
- [ ] Pull migrations into git (`supabase db pull` → `001_baseline.sql`)
- [ ] Sentry integration (`@sentry/nextjs`)
- [ ] Pino logger (replace `console.error`)
- [ ] `instrumentation.ts` (OTel)
- [ ] `global-error.tsx` + `error.tsx` per route group
- [ ] `withErrorHandler()` wrapper for API routes
- [ ] Security headers in `next.config.ts`
- [ ] Verify Next.js CVE-2025-29927 patch
- [ ] `patient_history` table + trigger (migration 017)

**Week 2: Patient CRUD + UI Restyling** ✅ DONE

- [x] Blue sidebar, flat design, shadcn theme
- [x] Patient list (search by name/DNI, pagination)
- [x] Create/edit patient
- [x] API routes + React Query hooks

**Week 3: Doctor Section** ✅ DONE

- [x] Doctor list + detail (profile, settings, schedules, overrides, slots)
- [x] Schedule editor with overlap detection
- [x] Server-side role authorization
- [x] 8 API routes + 12 React Query hooks

**Week 4: Appointments + FullCalendar** ← NEXT

- [ ] Migration 018: entreturno + rendicion fields + 2 new status enum values
- [ ] Appointment CRUD API routes
- [ ] `get_available_slots` updated for entreturno
- [ ] FullCalendar: day (multi-doctor columns), week, month views
- [ ] Quick booking: click slot → side panel → fill → save (target: <3s)
- [ ] Appointment detail/edit (slide-over panel)
- [ ] Status workflow: otorgado → confirmed → arrived → in_progress → completed/no_show
- [ ] DNI search in booking (auto-fill patient data)
- [ ] Inline new-patient creation from booking flow
- [ ] Entreturno: squeeze-in button on occupied slots
- [ ] Duplicate booking prevention (warn if patient has appointment that day)
- [ ] Realtime on appointments table
- [ ] Playwright E2E: full booking flow

**Week 5: Dashboard + Reports + Rendicion**

- [ ] Dashboard: today's agenda, quick stats, alerts panel
- [ ] Payment marking (secretary/admin only)
- [ ] Rendicion: `get_rendicion_summary()` + UI
- [ ] Coseguro/order number entry at patient arrival
- [ ] Reports: attendance, revenue by doctor, insurance breakdown, no-show trends
- [ ] PDF export: daily agenda, rendicion summary
- [ ] Doctor morning briefing view

**Week 6: Testing + CI/CD + Security**

- [ ] pgTAP tests: RLS for all 17 tables, all triggers, all functions
- [ ] Vitest tests: all API routes with role contexts
- [ ] GitHub Actions: lint → typecheck → test → deploy
- [ ] Supabase Branching (staging)
- [ ] Rate limiting (`@upstash/ratelimit`)
- [ ] Grafana Cloud dashboards
- [ ] Performance benchmark vs 3-second target
- [ ] `docs/compliance/personal-data-security-document.md`

**Phase 1 Exit Criteria:**
- Staff can manage patients, doctor schedules, and appointments
- Calendar with day/week/month views
- Rendicion with proper order → coseguro → patient links
- Entreturnos and duplicate prevention
- All RLS tested in CI
- Sentry + Grafana operational
- 4-layer tests in GitHub Actions
- Staging environment functional
- Booking flow p95 < 3 seconds

---

### Phase 2: Communications & WhatsApp (Weeks 7-10)

**Week 7: Python/FastAPI Backend Skeleton**

- [ ] `turnera-ai/` folder in this repo
- [ ] FastAPI project structure
- [ ] Supabase connection (`service_role` via `supabase-py`)
- [ ] Sentry + OTel instrumentation (cross-service traces)
- [ ] structlog for structured logging
- [ ] Docker + docker-compose
- [ ] CI/CD: GitHub Actions → build → test → deploy to Hetzner VPS

**Week 8: WhatsApp Integration**

- [ ] YCloud BSP: webhook receiver + message sender
- [ ] Settings page: BSP credentials, connection status, test message
- [ ] BSUID schema fields (migration 019)
- [ ] Message templates registered with Meta
- [ ] Delivery tracking (sent → delivered → read)
- [ ] Retry logic (exponential backoff)
- [ ] Multi-channel fallback (WhatsApp fail → flag for manual call)
- [ ] Celery + Redis + Celery Beat (reminder scheduler)

**Week 9: LangChain AI Agent**

- [ ] WhatsApp chatbot: intent → tool → response
- [ ] 9 LangChain tools
- [ ] Two-tier LLM strategy
- [ ] Patient matching by WhatsApp phone
- [ ] Conversation memory (Redis active, PostgreSQL historical)
- [ ] Bot-to-human handoff (2-3 failed intents → escalate)
- [ ] RAG: pgvector embeddings per clinic

**Week 10: Waitlist + Blacklist + Polish**

- [ ] Waitlist CRUD + auto-notification on slot opening
- [ ] Blacklist management UI
- [ ] Cancellation policy enforcement
- [ ] WhatsApp status badge in sidebar
- [ ] E2E tests: WhatsApp flow, reminders, waitlist
- [ ] Load test: concurrent WhatsApp messages

**Phase 2 Exit Criteria:**
- WhatsApp booking/cancellation/confirmation via chatbot
- Reminders (24h + same-day) via WhatsApp
- Delivery tracking visible in dashboard
- Waitlist with auto-notification
- Distributed tracing across Next.js ↔ FastAPI
- Bot-to-human handoff working

---

### Phase 3: CRM, Offline, Optimization (Weeks 11-14)

**Week 11: Patient CRM**

- [ ] Patient profile: full history, family links, tags, timeline
- [ ] Advanced search: filter by insurance, tag, frequency, blacklist
- [ ] Bulk operations: mass reschedule, mass notification

**Week 12: Advanced Reports + Recurring Appointments**

- [ ] Report builder: custom ranges, doctor/insurance filters
- [ ] Attendance analytics, revenue reports, rendicion reconciliation
- [ ] Recurring appointments ("every 3 months")
- [ ] Export: CSV + PDF
- [ ] Business metrics in Grafana

**Week 13: Offline + PWA**

- [ ] Serwist service worker
- [ ] React Query `persistQueryClient` → IndexedDB
- [ ] Mutation queue for offline writes
- [ ] Online/offline indicator
- [ ] Graceful degradation (read-only when offline)
- [ ] PWA manifest (installable)

**Week 14: AutoResearch Optimization + Polish**

- [ ] RAG pipeline optimization (AutoResearch loop)
- [ ] Chatbot prompt optimization
- [ ] Multi-clinic switcher polish
- [ ] Mobile responsive
- [ ] Accessibility pass
- [ ] Performance audit (Lighthouse)

**Phase 3 Exit Criteria:**
- Full CRM with patient history
- Reports with rendicion reconciliation
- PWA installable, offline read-only
- Chatbot optimized via benchmarking
- Mobile + accessibility pass

---

### Phase 4: Production Readiness & Scale (Weeks 15-17)

**Week 15: Data Migration (UPCN)**

- [ ] Data profiling + quality analysis
- [ ] Migration scripts: DNI, phones, insurance, doctors, prestaciones
- [ ] Import to staging + validation
- [ ] Parallel run (1-2 weeks)
- [ ] Secretary training (30-second booking target)
- [ ] Cutover

**Week 16: Multi-Clinic Onboarding**

- [ ] Enhanced `create-clinic.ts`
- [ ] Admin onboarding wizard in UI
- [ ] Per-clinic RAG population
- [ ] Per-clinic WhatsApp connection
- [ ] Per-tenant Grafana analytics

**Week 17: Hardening & Documentation**

- [ ] Disaster recovery test (PITR restore)
- [ ] All runbooks finalized
- [ ] Long-term archival pipeline
- [ ] Security audit
- [ ] AAIP registration (if required)
- [ ] Load test: 10 clinics, 100 concurrent users

**Phase 4 Exit Criteria:**
- UPCN live on Turnera
- At least 1 additional clinic onboarded
- DR tested and documented
- Load-tested for 10 clinics

---

### Phase 5: Sanatorio Module (Research complete, build when ready)

All 33 deep research sessions completed. Pending: meeting with Cittadino for infrastructure/budget.

**5.1** — Patient Flow Management (arrival → queue → doctor call)
**5.2** — Medical Imaging / PACS (Orthanc + OHIF + Supabase as RIS)
**5.3** — Billing Integration (rendicion at sanatorio scale)
**5.4** — AI Medical Dictation (Groq Whisper + GPT-4o-mini, ~$55/mo)
**5.5** — Patient Portal (WhatsApp OTP login, OHIF viewer, legally mandatory)
**5.6** — Doctor Tools (clinical history, order studies, track visits)
**5.7** — Middleware (Mirth Connect 4.5.2 — only when first HL7v2 device appears)

---

## 6. Project Structure

```
turnera/
├── docs/
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── database-schema.md
│   │   ├── api-routes.md
│   │   └── realtime.md
│   ├── compliance/
│   │   └── personal-data-security-document.md    # Disposicion 11/2006
│   ├── decisions/
│   │   ├── 001 through 012 (existing)
│   │   ├── 013-observability-stack.md             # NEW
│   │   └── 014-appointment-statuses.md            # NEW
│   ├── research-results/                          # 33 deep research files
│   │   ├── business/ (3), operations/ (4), patient-experience/ (2)
│   │   ├── sanatorio/ (12), technical/ (4), turnera-ux/ (8)
│   ├── runbooks/
│   │   ├── deploy.md, new-clinic-onboarding.md, database-migration.md
│   │   ├── troubleshooting.md, backup-restore.md
│   │   ├── disaster-recovery.md                   # NEW
│   │   └── incident-response.md                   # NEW
│   ├── superpowers/specs/
│   ├── system-design.md
│   ├── design-system.md
│   └── plan.md                                    # THIS PLAN
│
├── supabase/
│   ├── migrations/                                # ALL in git
│   │   ├── 001_baseline.sql
│   │   ├── 017_create_patient_history.sql
│   │   ├── 018_add_entreturno_rendicion.sql
│   │   ├── 019_add_bsuid_fields.sql
│   │   └── 020_create_rendicion_function.sql
│   ├── seed.sql
│   └── tests/                                     # pgTAP
│       ├── 01-rls-clinics.sql through 09-function-rendicion.sql
│
├── tools/scripts/
│   ├── seed.ts, create-user.ts, create-clinic.ts
│   ├── reset-db.ts, generate-types.ts
│   └── migrate-upcn.ts                            # NEW
│
├── .github/workflows/                              # NEW
│   ├── ci.yml
│   └── deploy.yml
│
├── src/
│   ├── instrumentation.ts                          # NEW — OTel
│   ├── app/
│   │   ├── global-error.tsx                        # NEW
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── error.tsx                           # NEW
│   │   │   ├── dashboard/, calendar/, appointments/
│   │   │   ├── patients/ ✅, doctors/ ✅
│   │   │   ├── waitlist/, reports/
│   │   │   ├── rendicion/                          # NEW
│   │   │   └── settings/
│   │   └── api/
│   │       ├── appointments/, patients/ ✅, doctors/ ✅
│   │       ├── waitlist/, rendicion/ (NEW), reminders/, reports/
│   ├── components/
│   │   ├── ui/, layout/ ✅, calendar/
│   │   ├── appointments/, patients/ ✅, doctors/ ✅
│   │   ├── dashboard/, waitlist/
│   │   ├── rendicion/ (NEW), reports/, shared/
│   ├── lib/
│   │   ├── supabase/ ✅, auth/ ✅, hooks/, types/, utils/, constants/
│   │   ├── logger.ts (NEW), error-handler.ts (NEW), rate-limit.ts (NEW)
│   └── providers/ ✅
│
├── e2e/                                            # NEW — Playwright
│   ├── booking-flow.spec.ts, patient-crud.spec.ts
│   ├── auth.spec.ts, rendicion.spec.ts
│
├── __tests__/                                      # NEW — Vitest
│   ├── api/ (patients, doctors, appointments, rendicion)
│   └── lib/ (error-handler, date-utils)
│
├── turnera-ai/                                     # NEW — Python backend (same repo for now)
│   ├── app/
│   │   ├── main.py                                 # FastAPI + Sentry + OTel
│   │   ├── config.py
│   │   ├── routes/ (whatsapp.py, health.py, admin.py)
│   │   ├── services/ (agent.py, rag.py, reminders.py, whatsapp.py)
│   │   ├── tools/ (9 LangChain tools, one file each)
│   │   ├── models/
│   │   └── db/
│   ├── worker/
│   │   ├── celery_app.py, beat_schedule.py
│   │   └── tasks/ (send_reminder, generate_embeddings, cleanup_sessions)
│   ├── tests/
│   ├── benchmarks/                                 # AutoResearch
│   │   ├── rag/ (prepare.py, target.py, program.md)
│   │   └── chatbot/ (prepare.py, target.py, program.md)
│   ├── Dockerfile, docker-compose.yml
│   ├── requirements.txt
│   └── .env.example
│
├── sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts  # NEW
├── playwright.config.ts, vitest.config.ts                                    # NEW
├── src/proxy.ts, next.config.ts, CLAUDE.md, package.json
```

---

## 7. Verification Plan (48 Tests)

### Phase 1 Verification

| # | Test | Method | Pass Criteria |
|---|------|--------|---------------|
| 1 | Migrations in git | `ls supabase/migrations/` | `001_baseline.sql` exists + matches production |
| 2 | RLS: tenant isolation | pgTAP | Tenant A gets 0 rows for Tenant B, all 17 tables |
| 3 | RLS: silent failure | pgTAP | Unauthenticated user gets 0 rows, not error |
| 4 | Trigger: overlap | pgTAP | Double-booking raises exception. Entreturno succeeds |
| 5 | Trigger: payment auth | pgTAP | Doctor rejected, secretary/admin allowed |
| 6 | Trigger: no-show counter | pgTAP | Increments for that clinic only |
| 7 | Trigger: patient audit | pgTAP | UPDATE creates `patient_history` row |
| 8 | Auth: login flow | Playwright | All roles log in. Invalid creds show error |
| 9 | Auth: route guards | Playwright | Unauth → `/login`. Doctor blocked from `/settings` |
| 10 | Auth: CVE-2025-29927 | Vitest | `x-middleware-subrequest` header rejected |
| 11 | Booking flow | Playwright | Slot → form → save → calendar. < 3 seconds |
| 12 | Entreturno | Playwright | Squeeze-in creates `is_entreturno=true` |
| 13 | Duplicate prevention | Playwright | Warning shown for same-day duplicate |
| 14 | Rendicion | Playwright | Order + coseguro → linked in summary |
| 15 | Status workflow | Vitest | Valid transitions pass, invalid rejected |
| 16 | Multi-clinic | Playwright | Switcher works, data isolated |
| 17 | Realtime | Manual | Two tabs: book in one → appears in other < 2s |
| 18 | Error boundaries | Manual | Kill Supabase → error boundary, Sentry captures |
| 19 | Observability | Manual | Error → Sentry < 30s. Trace → Grafana Tempo |
| 20 | Rate limiting | Vitest | 6th login/min → 429 |
| 21 | Performance | Lighthouse + Grafana | LCP < 2.5s, TTI < 3.5s, API p95 < 500ms |
| 22 | CI pipeline | GitHub Actions | All checks pass on PR |
| 23 | PDF export | Manual | Correct agenda data |
| 24 | Seed script | Bash | Completes without errors |

### Phase 2 Verification

| # | Test | Method | Pass Criteria |
|---|------|--------|---------------|
| 25 | WhatsApp send | Manual | Test message delivered |
| 26 | Reminder delivery | Manual | 24h reminder arrives |
| 27 | Delivery tracking | Manual | pending → sent → delivered → read |
| 28 | Chatbot: book | WhatsApp | "quiero turno" → books → visible in calendar |
| 29 | Chatbot: cancel | WhatsApp | Identifies and cancels appointment |
| 30 | Chatbot: handoff | WhatsApp | 3 failures → escalates to human |
| 31 | RAG | WhatsApp | Answers clinic-specific question |
| 32 | Distributed tracing | Grafana | Single trace across Next.js ↔ FastAPI |
| 33 | Waitlist notify | Manual | Cancel → waitlisted patient gets offer |
| 34 | FastAPI health | curl | 200 with uptime/version/DB status |

### Phase 3 Verification

| # | Test | Method | Pass Criteria |
|---|------|--------|---------------|
| 35 | Patient timeline | Playwright | Chronological list of all events |
| 36 | Family links | Playwright | Linked patients show on profiles |
| 37 | Reports accuracy | Vitest | Aggregates match SQL counts |
| 38 | Recurring appointments | Playwright | "Every 3 months" → 4 future appointments |
| 39 | Offline read | Manual | Disconnect → cached schedule visible |
| 40 | Offline queue | Manual | Mark arrived offline → syncs on reconnect |
| 41 | PWA install | Manual | Chrome install prompt works |
| 42 | AutoResearch RAG | Benchmark | Accuracy improves after loop |

### Phase 4 Verification

| # | Test | Method | Pass Criteria |
|---|------|--------|---------------|
| 43 | UPCN migration | Script | 5,327 patients, DNI normalized, no duplicates |
| 44 | Parallel run | Manual | Same appointment matches both systems |
| 45 | PITR restore | Manual | Data intact after restore |
| 46 | Load test | k6 | 100 concurrent users, p99 < 1.5s, 0 leaks |
| 47 | Secretary benchmark | Stopwatch | Booking < 30 seconds |
| 48 | Onboarding wizard | Playwright | Full new clinic setup works |

---

## 8. Operational Readiness

### Runbooks

| Runbook | Contents |
|---------|----------|
| `deploy.md` | GitHub → Vercel flow, migrations, rollback |
| `new-clinic-onboarding.md` | Create clinic, add staff, configure, connect WhatsApp, seed RAG |
| `database-migration.md` | Write, test (local + staging), deploy safely |
| `disaster-recovery.md` | PITR restore procedure, RTO/RPO, quarterly test |
| `incident-response.md` | Severity levels, escalation, postmortem template |
| `troubleshooting.md` | Auth, RLS, WhatsApp, migration common issues |
| `backup-restore.md` | PITR config, archive schedule, restore verification |

### Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| High error rate | > 5% on any route for 5 min | Critical |
| Slow API | p99 > 3s for 5 min | Warning |
| Auth spike | > 10 failures/min from same IP | Warning |
| Zero bookings | 0 in 2h during business hours | Critical |
| WhatsApp failures | > 20% delivery failures | Warning |
| Disk usage | Supabase > 80% storage | Warning |
| PITR lag | Backup lag > 5 minutes | Critical |

### Phase Summary

```
Phase 1: Core MVP          Weeks 1-6    (3 done, 3 remaining)
Phase 2: Communications    Weeks 7-10
Phase 3: CRM + Offline     Weeks 11-14
Phase 4: Production        Weeks 15-17
Phase 5: Sanatorio         TBD (after Cittadino meeting)
```
