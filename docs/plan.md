# Turnera — Engineering Plan v2

> **Last updated**: 2026-04-03
> **Supersedes**: Original plan (feature-only, 12 tables, n8n, no observability)
> **Design spec**: `docs/superpowers/specs/2026-04-01-engineering-plan-v2-design.md`

Informed by 33 deep research sessions, UPCN legacy system analysis (61 screenshots + field visit), and web research on medical SaaS best practices.

---

## 1. Context & Strategic Principles

**Turnera** is a multi-tenant medical appointment scheduling SaaS built by Althem Group. First client: UPCN (5,327 patients, 20+ doctors, 84 insurance plans). The system replaces a legacy web app running on `10.11.12.250` with broken financial tracking, no duplicate prevention, and minimal clinical history.

**Strategic principles:**

1. **Secretary-first UX** — Every booking must complete in <30 seconds. 2-week adoption window.
2. **WhatsApp is THE patient channel** — 93% penetration, 98% open rate. No web booking portal for MVP.
3. **Compliance from Day 1** — Ley 25.326 + Ley 26.529 + Disposicion 11/2006. Health data = CRITICAL level. 10-year retention. Audit trails legally mandatory.
4. **Fix the rendicion** — Order numbers linked to coseguro amounts via FK. No more hand-tracking.
5. **Offline-aware architecture** — 47% of Argentine clinics have unstable internet. Design patterns from Day 1, PWA later.
6. **No integrated competitor** — Turnos + PACS + obras sociales + AI dictation + patient portal = the moat.

**Key architecture decisions:**
- Multi-tenant via `clinic_id` + RLS
- Clinic-owned patients (no global table, DNI unique per clinic) — ADR-011
- Staff-only auth (admin/doctor/secretary). Patients never log in — ADR-003
- Python/FastAPI for AI/WhatsApp/reminders (supersedes n8n) — ADR-012
- Database triggers as source of truth for both Next.js and FastAPI

**Supabase project:** `lavfzixecvbvdqxyiwwl`

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 16 (App Router) + TypeScript strict | Verify CVE-2025-29927 patch |
| **UI** | shadcn/ui + Tailwind CSS 4 + Lucide icons | Blue/white flat design |
| **Calendar** | @fullcalendar/react 6.x | Day/week/month |
| **Forms** | react-hook-form + zod | |
| **Data Fetching** | React Query v5 | Offline persistence via `persistQueryClient` |
| **Charts** | recharts | |
| **PDF** | @react-pdf/renderer | |
| **Dates** | date-fns + date-fns-tz | TZ: America/Argentina/Buenos_Aires |
| **Toasts** | Sonner | |
| **Database** | Supabase (PostgreSQL + RLS + Auth + Realtime) | Pro + PITR for production |
| **AI Backend** | FastAPI + LangChain (Hetzner VPS, Docker) | `turnera-ai/` in this repo |
| **Task Queue** | Celery + Redis | Reminders, async |
| **RAG** | pgvector in Supabase + LangChain | Clinic-scoped |
| **WhatsApp** | YCloud BSP → FastAPI webhook | BSUID-ready (June 2026) |
| **Observability** | Sentry + OpenTelemetry + Grafana Cloud | From Day 1 |
| **Logging** | Pino (Next.js) + structlog (Python) | Structured JSON |
| **Rate Limiting** | @upstash/ratelimit + Upstash Redis | Edge, per-tenant |
| **Testing** | pgTAP + Vitest + Playwright + k6 | 4 layers |
| **CI/CD** | GitHub Actions | lint → typecheck → test → migrate → deploy |
| **Hosting** | Vercel + Hetzner VPS + Supabase | 3 environments |
| **Offline** | React Query persistence + Serwist (Phase 3) | Architecture-ready Day 1 |

---

## 3. Architecture & Cross-Cutting Concerns

### 3.1 Environment Strategy

| | Development | Staging | Production |
|---|---|---|---|
| Frontend | localhost:3000 | Vercel Preview | Vercel Production |
| Database | `supabase start` | Supabase Branch | Supabase Main |
| Python API | localhost:8000 | VPS staging container | VPS prod container |
| Data | Seed script | Anonymized prod copy | Real data |
| Secrets | .env.local | Vercel env vars | Vercel env vars |

All migrations in `supabase/migrations/`. Never develop against production.

### 3.2 CI/CD Pipeline

```
PR opened/pushed:
  ├── [parallel] ESLint + TypeScript typecheck
  ├── [parallel] Vitest + pgTAP tests
  ├── [sequential] Supabase branch → migrations → Vercel preview
  └── [sequential] Playwright E2E against preview

PR merged to main:
  ├── supabase db push (production migration)
  ├── Health check
  ├── Vercel production deploy
  └── Sentry release + source maps

Rollback: new reverse migration (never edit applied). Vercel instant rollback. PITR as last resort.
```

### 3.3 Observability (Day 1)

```
Browser ──→ Vercel (Next.js) ──→ Supabase ←── FastAPI (VPS)
  │              │                                │
  │         @sentry/nextjs                   sentry-sdk
  │         @vercel/otel                     otel-fastapi
  │              │                                │
  │              └──→ OTel Collector ◄────────────┘
  │                     │
  │              ┌──────┼──────────┐
  │              ▼      ▼          ▼
  │            Tempo   Loki    Prometheus
  │           (traces) (logs)  (metrics)
  │              └──────┼──────────┘
  │                     ▼
  │                  Grafana
  │
  └──→ Sentry (errors + performance + releases)
```

| Signal | What | Tool |
|--------|------|------|
| Errors | Unhandled exceptions, failed API calls | Sentry |
| Traces | Full request lifecycle across services | OTel → Tempo |
| Metrics | API latency p50/p95/p99, error rates | OTel → Prometheus |
| Logs | Structured JSON with requestId, clinicId | Pino/structlog → Loki |
| Business | Appointments/day, no-show rate, active clinics | Custom → Grafana |

**Alerts:** error rate >5% (5min), p99 >3s, auth spike >10/min, zero bookings 2h during business hours, WhatsApp >20% failures.

### 3.4 Error Handling Architecture

- `withErrorHandler(handler)` — single wrapper for all API routes. Handles logging, error classification, requestId, Sentry capture.
- Consistent responses: `{ error, code, requestId }`
- `global-error.tsx` + per-route `error.tsx` with retry + auto Sentry report
- React Query: 1 retry for network errors, 0 for 4xx

### 3.5 Security Model

1. **Transport**: HTTPS + security headers (CSP nonce-based, HSTS, X-Frame-Options DENY)
2. **Auth**: Supabase Auth, JWT httpOnly cookies, session refresh per request, `clinic_id` from JWT only
3. **Authorization**: RLS + `checkDoctorPermission()` + triggers. pgTAP tests in CI
4. **Rate Limiting**: `@upstash/ratelimit` in edge middleware. Login: 5/min by IP. Reads: 100/min. Writes: 30/min
5. **Validation**: Zod on every route. Parameterized queries (no SQL injection)
6. **Secrets**: `.env.local` dev only. Vercel encrypted for staging/prod. `service_role` only in `admin.ts`

### 3.6 Testing Strategy

| Layer | Tool | Tests | CI |
|-------|------|-------|-----|
| Database | pgTAP | RLS (18 tables), triggers, functions | Every PR |
| API | Vitest | Routes with admin/doctor/secretary/unauth contexts | Every PR |
| E2E | Playwright | Critical flows (booking, auth, rendicion) | Every PR |
| Load | k6 | Concurrent bookings, slot calculation | Pre-release |

### 3.7 Performance Budgets

| Metric | Target |
|--------|--------|
| Booking flow (click to confirmed) | < 3s |
| API p95 | < 500ms |
| API p99 | < 1.5s |
| `get_available_slots` RPC | < 200ms |
| LCP | < 2.5s |
| TTI | < 3.5s |
| Calendar render (week, 5 doctors) | < 1s |

### 3.8 Legal Compliance

**Audit trails (Ley 26.529):**
- `appointment_history` — existing, immutable log
- `patient_history` — **NEW** (migration 017), immutable log for all `clinic_patients` changes
- Insert-only. No UPDATE/DELETE policies. 10-year retention.

**Disposicion 11/2006:** `docs/compliance/personal-data-security-document.md` before production.

**Encryption:** AES-256 at rest (Supabase), TLS 1.2+ in transit, encrypted columns for clinic secrets.

### 3.9 Backup & Disaster Recovery

| RPO | < 1 minute (PITR) |
|-----|-----|
| RTO | < 1 hour |
| Retention | 10 years (legal) |

PITR on Supabase Pro. Quarterly restore tests. Yearly cold storage archive for audit tables.

### 3.10 Offline-Aware Architecture

**Phase 1:** React Query `gcTime: Infinity` for critical data. Optimistic mutations. requestId for idempotency.

**Phase 3:** Serwist service worker. `persistQueryClient` → IndexedDB. Mutation queue. Never cache patient PII offline. Server timestamp wins conflicts.

### 3.11 Data Migration (UPCN)

**A. Profile** → export, analyze quality, map fields
**B. Transform** → DNI strip dots, phones to +54, map 84 insurance plans, map 18 prestaciones
**C. Parallel run** → 1-2 weeks both systems, daily validation
**D. Cutover** → delta import, legacy read-only, retain 10 years

### 3.12 Cost Projection

| Service | Phase 1 (1 clinic) | Phase 2 (5) | Phase 3 (10+) |
|---------|-------------------|-------------|---------------|
| Supabase Pro + PITR | $35/mo | $35/mo | $35/mo |
| Vercel Pro | $20/mo | $20/mo | $20/mo |
| Hetzner VPS | $5/mo | $10/mo | $20/mo |
| Sentry | $0 | $0 | $26/mo |
| Grafana Cloud | $0 | $0 | $0 |
| Upstash Redis | $0 | $0 | $10/mo |
| WhatsApp (YCloud) | $5/mo | $25/mo | $50/mo |
| Claude API (LLM) | $10/mo | $30/mo | $60/mo |
| **Total** | **~$75/mo** | **~$120/mo** | **~$221/mo** |

---

## 4. Database Schema (18 Tables)

### Architecture

```
GLOBAL:     staff, doctors
JUNCTION:   staff_clinics, doctor_clinic_settings
PER-CLINIC: clinics, clinic_patients, appointments, doctor_schedules,
            schedule_overrides, waitlist, reminders, appointment_history,
            patient_history (NEW), doctor_invitations (NEW Phase 4),
            clinic_faqs, clinic_services, document_embeddings,
            conversation_sessions
```

### New: `patient_history` (Table 17 — Legal Compliance)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| patient_id | UUID FK → clinic_patients | |
| clinic_id | UUID FK → clinics | Denormalized for RLS |
| action | TEXT NOT NULL | created/updated/deleted |
| old_values | JSONB | null on create |
| new_values | JSONB | null on delete |
| changed_fields | TEXT[] | Quick scan without diffing |
| performed_by | UUID FK → staff | |
| performed_by_role | TEXT | Role at time of change |
| ip_address | TEXT | |
| created_at | TIMESTAMPTZ | |

RLS: SELECT only. No UPDATE/DELETE. Trigger: AFTER INSERT/UPDATE/DELETE on `clinic_patients`.

### Schema Changes to Existing Tables

**`clinics`**: + `whatsapp_bsp_provider`, `whatsapp_bsp_api_key`, `whatsapp_bsuid_enabled`

**`clinic_patients`**: + `whatsapp_bsuid` (Meta BSUID, June 2026)

**`appointments`**: + `is_entreturno` (squeeze-in), `coseguro_amount`, `order_number` (rendicion FK)

**`appointment_status` enum**: + `otorgado` (pre-confirmation), `cancelled_clinic` (by medical center)

Status flow: `otorgado → confirmed → arrived → in_progress → completed/no_show`. Cancel branches: `cancelled_patient`, `cancelled_doctor`, `cancelled_clinic`, `rescheduled`.

### New: `doctor_invitations` (Table 18 — Multi-Clinic Doctor Linking)

Added in Phase 4 when multi-clinic support is needed. Not required for single-clinic MVP.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| doctor_id | UUID FK → doctors | Who's being invited |
| clinic_id | UUID FK → clinics | Who's inviting |
| invited_by | UUID FK → staff | Which admin sent it |
| status | TEXT DEFAULT 'pending' | pending/accepted/declined/expired |
| token | TEXT UNIQUE | For email acceptance link |
| expires_at | TIMESTAMPTZ | 7 days from creation |
| created_at | TIMESTAMPTZ | |
| responded_at | TIMESTAMPTZ | |

RLS: SELECT by clinic admin who invited + the invited doctor. INSERT by clinic admins. UPDATE by invited doctor only (to accept/decline).

### New Functions

- `create_doctor_at_clinic(email, password, first_name, last_name, specialty, license, clinic_id, slot_duration, fee)` — SECURITY DEFINER function that atomically creates auth user + staff + staff_clinics + doctors + doctor_clinic_settings in one transaction. Rolls back everything if any step fails. Used by POST /api/doctors.
- `link_doctor_to_clinic(doctor_id, clinic_id, slot_duration, fee)` — SECURITY DEFINER function that atomically creates staff_clinics + doctor_clinic_settings. Used by POST /api/doctors/link (Phase 1 direct, Phase 4 after invitation acceptance).
- `get_rendicion_summary(clinic_id, doctor_id, date_start, date_end)` — proper FK reconciliation
- `get_available_slots` updated — `can_entreturno` flag, respects `allows_overbooking`

### Migrations

1. `001_baseline.sql` ✅ (full schema: 14 enums, 17 tables, 37 FKs, 9 functions, 37 RLS policies)
2. `017_create_patient_history.sql` ✅ (audit table + trigger, applied to production)
3. `018_create_doctor_functions.sql` — `create_doctor_at_clinic()` + `link_doctor_to_clinic()` SECURITY DEFINER functions
4. `019_add_entreturno_rendicion.sql`
5. `020_add_bsuid_fields.sql`
6. `021_create_rendicion_function.sql`
7. `022_create_doctor_invitations.sql` — Phase 4 (multi-clinic invitation table + RLS)

---

## 5. Implementation Phases

### Phase 1: Core MVP (Weeks 1-6)

**Week 1: Foundation + Observability** ✅ DONE

- [x] Next.js + Supabase + Auth + Login + Seed
- [x] Sentry (`@sentry/nextjs` — client, server, edge configs)
- [x] Pino structured logger (`src/lib/logger.ts`)
- [x] `instrumentation.ts` (OTel)
- [x] Error boundaries (`global-error.tsx` + `(dashboard)/error.tsx`)
- [x] `withErrorHandler()` wrapper (`src/lib/error-handler.ts`)
- [x] Security headers + Sentry webpack config (`next.config.ts`)
- [x] Migration 017: `patient_history` (audit trail, Ley 26.529)
- [x] Migration README + developer setup guide
- [x] Pull baseline migrations to git (`001_baseline.sql` — 1285 lines, full schema)

**Week 2: Patients** ✅ DONE

- [x] Patient CRUD API (GET list, GET by id, POST create, PUT update)
- [x] Patient components (table, search, form)
- [x] Patient pages (list, detail, new)
- [x] React Query hooks (`use-patients.ts`)

**Week 3: Doctors** ✅ DONE

- [x] Doctor list API (GET /api/doctors)
- [x] Doctor detail API (GET /api/doctors/[id])
- [x] Doctor settings API (GET/PUT /api/doctors/[id]/settings)
- [x] Doctor schedules API (CRUD /api/doctors/[id]/schedules)
- [x] Doctor overrides API (CRUD /api/doctors/[id]/overrides)
- [x] Available slots API (GET /api/doctors/[id]/available-slots)
- [x] Doctor components (table, profile form, schedule editor, override manager, clinic settings form, slots preview)
- [x] Doctor pages (list, detail)
- [x] React Query hooks (`use-doctors.ts`)
- [x] Server-side role authorization on all doctor mutation endpoints
- [x] Migration 018: `create_doctor_at_clinic()` + `link_doctor_to_clinic()` DB functions (atomic, SECURITY DEFINER)
- [x] POST /api/doctors — create new doctor (auth + staff + staff_clinics + doctors + doctor_clinic_settings in one transaction)
- [x] POST /api/doctors/link — link existing doctor to a clinic (staff_clinics + doctor_clinic_settings)
- [x] POST /api/doctors/lookup — search by email, return minimal info (partial name + specialty only)
- [x] "Add Doctor" UI — new vs existing flow, admin only
- [x] DELETE /api/doctors/[id]/settings — soft-deactivate doctor at a clinic (set is_active=false)

**Week 4: Appointments + FullCalendar** ✅ DONE

- [x] Migration 019: entreturno + rendicion + status enum + doctor permissions
- [x] Appointment CRUD API (list, detail, create with inline patient, update, status change, reschedule)
- [x] Doctor queue API (waiting room grouped by status)
- [x] React Query hooks (useAppointments, useCreateAppointment, useUpdateAppointmentStatus, useRescheduleAppointment, useDoctorQueue)
- [x] FullCalendar: day (multi-doctor columns), week (single doctor), month (aggregate badges)
- [x] Quick booking side panel with patient search autocomplete + inline new patient creation
- [x] Status workflow (confirmed → arrived → in_progress → completed, with cancel/no_show branches)
- [x] Appointment detail panel with contextual action buttons (role-based)
- [x] Drag-and-drop rescheduling with confirmation dialog
- [x] Doctor's waiting room view (in progress / waiting / upcoming queue)
- [x] Supabase Realtime subscription for live calendar updates
- [x] Doctor appointment permission toggles (can_create/cancel_appointments, admin-controlled)
- [x] Status constants (colors, labels, valid transitions)
- [x] Patient search: accent+case insensitive via generated column + GIN trigram (migration 022) + loading-state fix (no more "not found" flash)
- [ ] Playwright E2E booking flow (deferred to Week 6)
- [ ] Duplicate booking prevention UI warning (handled by DB trigger, UI warning deferred)

**Week 5: Dashboard + Reports + Rendicion**

- [ ] Dashboard: agenda, stats, alerts
- [ ] Payment marking (secretary/admin)
- [ ] Rendicion UI + `get_rendicion_summary()`
- [ ] Coseguro/order entry at arrival
- [ ] Reports: attendance, revenue, insurance, no-shows
- [ ] PDF export
- [ ] Doctor morning briefing

**Week 6: Testing + CI/CD + Security**

- [ ] pgTAP: RLS (18 tables) + triggers + functions
- [ ] Vitest: all API routes
- [ ] GitHub Actions pipeline
- [ ] Supabase Branching (staging)
- [ ] Rate limiting
- [ ] Grafana dashboards
- [ ] Performance benchmark
- [ ] Compliance document

**Exit criteria:** Full appointment lifecycle, rendicion, entreturnos, tested CI, Sentry + Grafana, staging, booking p95 < 3s.

---

### Phase 2: Communications & WhatsApp (Weeks 7-10)

**Week 7:** FastAPI skeleton in `turnera-ai/` — Sentry, OTel, structlog, Docker, CI/CD
**Week 8:** WhatsApp (YCloud BSP, delivery tracking, retry, fallback, Celery reminders, BSUID schema)
**Week 9:** LangChain agent (9 tools, two-tier LLM, RAG, conversation memory, bot-to-human handoff)
**Week 10:** Waitlist + blacklist + cancellation policy + E2E + load test

**Exit criteria:** WhatsApp booking/cancel/confirm, reminders, delivery tracking, RAG, distributed tracing, handoff.

---

### Phase 3: CRM, Offline, Optimization (Weeks 11-14)

**Week 11:** Patient CRM (history, family, tags, timeline, bulk ops)
**Week 12:** Reports (custom ranges, recurring appointments, CSV/PDF, Grafana business metrics)
**Week 13:** Offline PWA (Serwist, IndexedDB, mutation queue, graceful degradation)
**Week 14:** AutoResearch optimization + mobile + accessibility + performance audit

**Exit criteria:** CRM, reports, PWA offline read-only, chatbot optimized, mobile + a11y.

---

### Phase 4: Production Readiness (Weeks 15-17)

**Week 15:** UPCN data migration (profile, transform, parallel run, secretary training, cutover)
**Week 16:** Multi-clinic onboarding (wizard, per-clinic RAG, WhatsApp, Grafana per-tenant, doctor invitation system — migration 022, accept/decline flow, email notifications)
**Week 17:** Hardening (DR test, runbooks, archival, security audit, AAIP, load test 10 clinics)

**Exit criteria:** UPCN live, 1+ additional clinic, DR tested, load-tested.

---

### Phase 5: Sanatorio Module (TBD — after Cittadino meeting)

Research complete (33 sessions). Build when infrastructure/budget confirmed.

- **5.1** Patient Flow (queue, wait times, doctor call)
- **5.2** PACS (Orthanc + OHIF + Supabase RIS)
- **5.3** Billing (rendicion at scale, Circulo Medico/FEMER integration)
- **5.4** AI Dictation (Groq Whisper + GPT-4o-mini, ~$55/mo)
- **5.5** Patient Portal (WhatsApp OTP, OHIF viewer, legally mandatory)
- **5.6** Doctor Tools (clinical history, order studies)
- **5.7** Middleware (Mirth Connect 4.5.2 when first HL7v2 device)

---

## 6. Project Structure

```
turnera/
├── docs/
│   ├── architecture/          # overview, database-schema, api-routes, realtime
│   ├── compliance/            # personal-data-security-document.md (NEW)
│   ├── decisions/             # 001-014 (013 observability, 014 statuses — NEW)
│   ├── research-results/      # 33 files in 6 categories
│   ├── runbooks/              # + disaster-recovery.md, incident-response.md (NEW)
│   ├── superpowers/specs/     # design specs
│   └── plan.md                # THIS FILE
│
├── supabase/
│   ├── migrations/            # ALL in git (001_baseline + 017-020)
│   ├── seed.sql
│   └── tests/                 # pgTAP (01-09)
│
├── tools/scripts/             # + migrate-upcn.ts (NEW)
├── .github/workflows/         # ci.yml + deploy.yml (NEW)
│
├── src/
│   ├── instrumentation.ts     # OTel (NEW)
│   ├── app/
│   │   ├── global-error.tsx   # (NEW)
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── error.tsx      # (NEW)
│   │   │   ├── dashboard/, calendar/, appointments/
│   │   │   ├── patients/ ✅, doctors/ ✅
│   │   │   ├── waitlist/, reports/, rendicion/ (NEW), settings/
│   │   └── api/
│   │       ├── patients/ ✅, doctors/ ✅
│   │       ├── appointments/, waitlist/, rendicion/ (NEW)
│   │       ├── reminders/, reports/
│   ├── components/            # + rendicion/ (NEW)
│   ├── lib/
│   │   ├── logger.ts, error-handler.ts, rate-limit.ts  # (NEW)
│   │   ├── supabase/ ✅, auth/ ✅, hooks/, types/, utils/, constants/
│   └── providers/ ✅
│
├── e2e/                       # Playwright (NEW)
├── __tests__/                 # Vitest (NEW)
│
├── turnera-ai/                # Python backend (same repo for now)
│   ├── app/ (main, config, routes/, services/, tools/, models/, db/)
│   ├── worker/ (celery, tasks/, beat_schedule)
│   ├── tests/, benchmarks/ (AutoResearch)
│   ├── Dockerfile, docker-compose.yml, requirements.txt
│
├── sentry.*.config.ts         # (NEW)
├── playwright.config.ts       # (NEW)
├── vitest.config.ts           # (NEW)
├── src/proxy.ts, next.config.ts, CLAUDE.md, package.json
```

---

## 7. Verification Plan (48 Tests)

### Phase 1 (24 tests)

| # | Test | Method | Criteria |
|---|------|--------|----------|
| 1 | Migrations in git | ls | 001_baseline.sql exists |
| 2 | RLS: tenant isolation | pgTAP | 0 rows for other tenant, all 18 tables |
| 3 | RLS: silent failure | pgTAP | 0 rows for unauth, not error |
| 4 | Trigger: overlap | pgTAP | Double-book rejected, entreturno passes |
| 5 | Trigger: payment | pgTAP | Doctor rejected, secretary/admin pass |
| 6 | Trigger: no-show | pgTAP | Counter increments per-clinic |
| 7 | Trigger: patient audit | pgTAP | UPDATE → patient_history row |
| 8 | Auth: login | Playwright | All roles, invalid creds error |
| 9 | Auth: guards | Playwright | Unauth → /login, doctor blocked from /settings |
| 10 | Auth: CVE | Vitest | x-middleware-subrequest rejected |
| 11 | Booking flow | Playwright | Slot → form → save → calendar < 3s |
| 12 | Entreturno | Playwright | Squeeze-in with is_entreturno=true |
| 13 | Duplicate prevention | Playwright | Same-day warning |
| 14 | Rendicion | Playwright | Order + coseguro linked in summary |
| 15 | Status workflow | Vitest | Valid transitions pass, invalid rejected |
| 16 | Multi-clinic | Playwright | Switcher works, data isolated |
| 17 | Realtime | Manual | Two tabs, < 2s sync |
| 18 | Error boundaries | Manual | Kill DB → boundary shown, Sentry captures |
| 19 | Observability | Manual | Error → Sentry < 30s, trace in Grafana |
| 20 | Rate limiting | Vitest | 6th login/min → 429 |
| 21 | Performance | Lighthouse/Grafana | LCP < 2.5s, TTI < 3.5s, API p95 < 500ms |
| 22 | CI pipeline | GH Actions | All checks pass |
| 23 | PDF export | Manual | Correct data |
| 24 | Seed script | Bash | No errors |

### Phase 2 (10 tests)

| # | Test | Method | Criteria |
|---|------|--------|----------|
| 25-27 | WhatsApp send, reminder, tracking | Manual | Delivered, states tracked |
| 28-30 | Chatbot book/cancel/handoff | WhatsApp | Flow completes correctly |
| 31 | RAG | WhatsApp | Clinic-specific answer |
| 32 | Distributed tracing | Grafana | Single trace across services |
| 33 | Waitlist notify | Manual | Cancel → offer sent |
| 34 | FastAPI health | curl | 200 |

### Phase 3 (8 tests)

| # | Test | Method | Criteria |
|---|------|--------|----------|
| 35-36 | Timeline, family | Playwright | Correct display |
| 37 | Reports accuracy | Vitest | Matches SQL |
| 38 | Recurring | Playwright | 4 future appointments |
| 39-41 | Offline read/queue/PWA | Manual | Cache works, syncs, installable |
| 42 | AutoResearch RAG | Benchmark | Accuracy improves |

### Phase 4 (6 tests)

| # | Test | Method | Criteria |
|---|------|--------|----------|
| 43 | UPCN migration | Script | 5,327 patients, clean |
| 44 | Parallel run | Manual | Data matches |
| 45 | PITR restore | Manual | Data intact |
| 46 | Load test | k6 | 100 users, p99 < 1.5s, 0 leaks |
| 47 | Secretary benchmark | Stopwatch | < 30 seconds |
| 48 | Onboarding wizard | Playwright | Full setup works |

---

## 8. Operational Readiness

### Runbooks

| Runbook | Contents |
|---------|----------|
| deploy.md | GitHub → Vercel, migrations, rollback |
| new-clinic-onboarding.md | Clinic → staff → doctors → WhatsApp → RAG |
| database-migration.md | Write, test, deploy safely |
| disaster-recovery.md | PITR restore, RTO/RPO, quarterly test |
| incident-response.md | Severity, escalation, postmortem |
| troubleshooting.md | Auth, RLS, WhatsApp, migrations |
| backup-restore.md | PITR config, archive, verification |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Error rate | > 5% / 5min | Critical |
| Slow API | p99 > 3s / 5min | Warning |
| Auth spike | > 10 failures/min/IP | Warning |
| Zero bookings | 2h during business hours | Critical |
| WhatsApp failures | > 20% delivery | Warning |
| Disk usage | > 80% Supabase | Warning |
| PITR lag | > 5 minutes | Critical |

### Timeline

```
Phase 1: Core MVP          Weeks 1-6    (Weeks 1-3 done, Weeks 4-6 remaining)
Phase 2: Communications    Weeks 7-10
Phase 3: CRM + Offline     Weeks 11-14
Phase 4: Production        Weeks 15-17
Phase 5: Sanatorio         TBD (after Cittadino meeting)
```
