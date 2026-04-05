# Turnera — Medical Appointment Scheduling SaaS

## What is this project?

A multi-tenant appointment scheduling system ("turnera") for medical offices. Built by Althem Group. Each clinic gets their own isolated data but shares the same database and infrastructure.

## Tech Stack

- **Language**: TypeScript (all code)
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS (white, minimal, easily modifiable)
- **Calendar**: @fullcalendar/react
- **Database**: Supabase (PostgreSQL + RLS + Realtime + Auth)
- **Hosting**: Vercel (auto-deploy via GitHub push)
- **AI Backend**: FastAPI + LangChain on VPS (Docker) — WhatsApp chatbot, RAG, reminders, AI agent
- **Forms**: react-hook-form + zod
- **Charts**: recharts
- **PDF**: @react-pdf/renderer
- **Dates**: date-fns + date-fns-tz (timezone: America/Argentina/Buenos_Aires)

## Supabase Project

- Project ref: `lavfzixecvbvdqxyiwwl`
- URL: `https://lavfzixecvbvdqxyiwwl.supabase.co`
- Project name: turnera

## Key Architecture Decisions

### Multi-Tenancy
Every per-clinic table has `clinic_id`. RLS policies filter by `clinic_id = ANY(get_user_clinic_ids())`. See `docs/decisions/002-multi-tenancy.md`.

### Global vs Per-Clinic Entities
- **Global** (no clinic_id): `staff`, `doctors`
- **Junction tables** (per-clinic metadata): `staff_clinics`, `doctor_clinic_settings`
- **Per-clinic** (always have clinic_id): `clinic_patients`, `appointments`, `waitlist`, `reminders`, `doctor_schedules`, `schedule_overrides`, `appointment_history`, `clinic_faqs`, `clinic_services`, `document_embeddings`, `conversation_sessions`

### Auth Model
Only staff logs in (admin/doctor/secretary). Patients do NOT have accounts. See `docs/decisions/003-auth-model.md`.

### Patient Identity
Each clinic owns their patient records independently in `clinic_patients`. DNI is unique per clinic (`UNIQUE(clinic_id, dni)`), not globally. There is no shared/global patient table — if a patient visits two clinics, they exist as two separate records. This keeps queries simple (no JOINs) and gives each clinic full control over their data. See `docs/decisions/011-clinic-owned-patients.md`.

### Payments
Only admin and secretary can mark payments. Doctors see payment status as read-only. Enforced by database trigger. See `docs/decisions/007-payment-permissions.md`.

### Python AI Backend
A separate FastAPI service handles all AI, WhatsApp, and automation. It talks directly to Supabase with `service_role` key (no Next.js middleman). LangChain orchestrates the AI agent with tools for booking, cancellation, RAG, patient queries. Celery + Redis handles scheduled reminders. See `docs/decisions/012-python-ai-backend.md`.

### WhatsApp Connection
Initially via external BSP (YCloud or similar) — becoming Meta Tech Provider is deferred. Clinics connect via BSP's platform, credentials stored in `clinics` table. Coexistence mode: clinic keeps WhatsApp Business app while API runs in parallel. See `docs/decisions/008-whatsapp-bsp.md`.

### No Billing Tables
No subscription/billing tables for now. Everyone gets full access during development. Add billing when ready to sell. See `docs/decisions/009-no-billing-tables.md`.

## Roles & Permissions

| Capability | Admin | Secretary | Doctor |
|-----------|-------|-----------|--------|
| View calendar (all doctors) | Yes | Yes | Own only |
| Create/cancel appointments | Yes | Yes | Own only |
| Manage patients (CRUD) | Yes | Yes | Read only |
| Mark payments | Yes | Yes | No (read-only) |
| Manage doctor schedules | Yes | No | Own only |
| View reports | Yes | Yes | Own only |
| Manage staff + clinic settings | Yes | No | No |

## Project Structure

```
docs/                    # Documentation (architecture, decisions, runbooks, system-design, design-system)
tools/scripts/           # Utility scripts (seed, create-user, create-clinic, reset-db, generate-types)
supabase/migrations/     # SQL migration files
src/app/(auth)/          # Login page (staff only)
src/app/(dashboard)/     # Dashboard pages (calendar, appointments, patients, etc.)
src/app/api/             # API routes (appointments, patients, waitlist, doctors, reports)
src/components/          # React components organized by feature
src/lib/                 # Supabase clients, hooks, types, utils, constants
src/providers/           # AuthProvider, ClinicProvider, RealtimeProvider
middleware.ts            # Auth redirect + role-based route guards
```

## Database Tables (16)

1. `clinics` — tenant config
2. `staff` — staff identity (global)
3. `staff_clinics` — staff ↔ clinic + role (junction)
4. `doctors` — doctor profile (global)
5. `doctor_clinic_settings` — per-clinic doctor config (junction)
6. `clinic_patients` — all patient data per clinic (personal info + metadata, blacklist, CRM)
7. `doctor_schedules` — weekly recurring availability
8. `schedule_overrides` — one-off exceptions (vacations, sick days)
9. `appointments` — core table
10. `waitlist` — patients waiting for openings
11. `appointment_history` — immutable audit log
12. `reminders` — outbound communication tracking
13. `clinic_faqs` — admin-managed FAQ entries per clinic (for RAG)
14. `clinic_services` — services offered per clinic (for RAG + future billing)
15. `document_embeddings` — pgvector store for RAG (clinic-scoped embeddings)
16. `conversation_sessions` — completed WhatsApp conversations (analytics)

## Database Functions

- `get_user_clinic_ids()` — returns UUID[] of user's clinics (used in all RLS policies)
- `get_user_role(clinic_id)` — returns role at specific clinic
- `get_available_slots(doctor_id, date, clinic_id)` — returns time slots with availability
- `check_appointment_overlap()` — trigger preventing double-booking
- `check_payment_update()` — trigger restricting payment changes to admin/secretary
- `update_no_show_count()` — trigger auto-incrementing clinic_patients.no_show_count
- `match_clinic_documents(query_embedding, clinic_id, count)` — pgvector similarity search filtered by clinic_id

## UI Design

- White background, gray-50/100 cards, minimal blue accent
- Status colors: green (confirmed), yellow (pending), red (cancelled/emergency), gray (no-show)
- Typography: Inter or system font stack
- See `docs/design-system.md` for full spec

### Data Fetching
React Query (TanStack Query) for all data fetching from API routes. Provides caching, loading/error states, and cache invalidation after mutations. See `docs/superpowers/specs/2026-03-16-turnera-architecture-design.md`.

## Code Style

- All code, comments, variable names, and commit messages in English
- Use TypeScript strict mode
- Use `date-fns` for all date manipulation (never raw Date methods)
- All times stored in UTC in the database, displayed in clinic's timezone
- Prefer server components; use `"use client"` only when needed (interactivity, hooks)
- API routes validate input with zod schemas

## Workflow Rules

- **Always update `docs/plan.md`** after completing any task. Mark checkboxes as done, update statuses, add notes. Commit and push the plan update together with the task commit or immediately after.
- Never leave completed work untracked in the plan.

## Educational Context

The user is learning web development through this project. When writing code:
- Explain WHAT the code does and WHY before writing it
- Don't assume knowledge of React, Next.js, or TypeScript
- Connect new concepts to the turnera project, not abstract examples
- Explain before code, not after

### MANDATORY: Explain After Every Task

After completing ANY implementation task (feature, migration, refactor, fix), you MUST explain what you did. For EACH file created or modified:

1. Link the file using `[filename.ts](path/to/file.ts)` syntax
2. Show the actual code that was written or changed
3. Explain every line of CODE individually (skip comments). If a line has multiple concepts, explain each word/symbol separately. Never summarize — go line by line, word by word if needed
4. Use analogies to connect abstract concepts to real-world things
5. Ask "Do you understand? Should I go deeper, or continue to the next file?"

Explain in dependency order: database changes → API routes → hooks → components → pages → config/docs. Never skip a file. Never assume the user knows a concept — explain it when it first appears.

## Documentation

- `docs/architecture/` — system overview, database schema, API routes, realtime
- `docs/decisions/` — ADR files (001-011) with context, decision, alternatives, consequences
- `docs/runbooks/` — deploy, onboarding, migrations, troubleshooting, backup
- `docs/system-design.md` — backend data flow, auth flow, appointment lifecycle
- `docs/design-system.md` — colors, typography, spacing, component guidelines
- `docs/plan.md` — master implementation plan

## Second Brain (Obsidian)

Project notes live in `C:\Users\UPCN\OneDrive\SecondBrain\01-Projects\UPCN\Turnera\`.
Everything related to this project (turnera, sanatorio system, research) goes in that ONE folder — do NOT create separate project folders.
Key files:
- `turnera-overview.md` — general project overview
- `sanatorio-system-overview.md` — medical imaging/clinic management module (PACS replacement for Sanatorio UPCN)
- `sanatorio-research-backlog.md` — deep research topics pending (DICOM, RIS, legal, AI dictation, etc.)

## Sanatorio Features (Phase 5)

Turnera will expand with sanatorio-grade features — these are NOT a separate project, they're additional modules for Turnera:
- Imaging/PACS replacement, patient flow, billing, AI dictation, patient portal
- First deployment: Sanatorio de UPCN (director: Cittadino, via José Allende who is the boss at UPCN and Geronimo's dad)
- Sanatorio Allende = reference/inspiration only, NOT a client
- Status: research phase — see `sanatorio-research-backlog.md` in Second Brain

## Deployment

- Push to GitHub → Vercel auto-deploys
- Database migrations: `npx supabase db push --project-ref lavfzixecvbvdqxyiwwl`
- Type generation: `npx supabase gen types typescript --project-id lavfzixecvbvdqxyiwwl > src/lib/types/database.ts`
