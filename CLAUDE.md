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
- **Chatbot**: n8n on EasyPanel VPS (one workflow per clinic, built later)
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
- **Global** (no clinic_id): `patients`, `staff`, `doctors`
- **Junction tables** (per-clinic metadata): `clinic_patients`, `staff_clinics`, `doctor_clinic_settings`
- **Per-clinic** (always have clinic_id): `appointments`, `waitlist`, `reminders`, `doctor_schedules`, `schedule_overrides`, `appointment_history`

### Auth Model
Only staff logs in (admin/doctor/secretary). Patients do NOT have accounts. See `docs/decisions/003-auth-model.md`.

### Patient Identity
Patients are global (DNI is unique key). `clinic_patients` junction table holds per-clinic metadata: blacklist status, no-show count, insurance, tags. A patient blacklisted at Clinic A is NOT blacklisted at Clinic B. See `docs/decisions/005-global-patients.md`.

### Payments
Only admin and secretary can mark payments. Doctors see payment status as read-only. Enforced by database trigger. See `docs/decisions/007-payment-permissions.md`.

### n8n Workflows
One workflow per clinic (not shared). Each clinic has its own WhatsApp number and webhook URL. See `docs/decisions/006-n8n-per-clinic.md`.

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
src/app/api/             # API routes (appointments, patients, waitlist, reminders, chatbot)
src/components/          # React components organized by feature
src/lib/                 # Supabase clients, hooks, types, utils, constants
src/providers/           # AuthProvider, ClinicProvider, RealtimeProvider
middleware.ts            # Auth redirect + role-based route guards
```

## Database Tables (13)

1. `clinics` — tenant config
2. `staff` — staff identity (global)
3. `staff_clinics` — staff ↔ clinic + role (junction)
4. `doctors` — doctor profile (global)
5. `doctor_clinic_settings` — per-clinic doctor config (junction)
6. `patients` — patient identity (global, DNI unique)
7. `clinic_patients` — per-clinic patient metadata (junction, blacklist, CRM)
8. `doctor_schedules` — weekly recurring availability
9. `schedule_overrides` — one-off exceptions (vacations, sick days)
10. `appointments` — core table
11. `waitlist` — patients waiting for openings
12. `appointment_history` — immutable audit log
13. `reminders` — outbound communication tracking

## Database Functions

- `get_user_clinic_ids()` — returns UUID[] of user's clinics (used in all RLS policies)
- `get_user_role(clinic_id)` — returns role at specific clinic
- `get_available_slots(doctor_id, date, clinic_id)` — returns time slots with availability
- `check_appointment_overlap()` — trigger preventing double-booking
- `check_payment_update()` — trigger restricting payment changes to admin/secretary
- `update_no_show_count()` — trigger auto-incrementing clinic_patients.no_show_count

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

## Educational Context

The user is learning web development through this project. When writing code:
- Explain WHAT the code does and WHY before writing it
- Don't assume knowledge of React, Next.js, or TypeScript
- Connect new concepts to the turnera project, not abstract examples
- Explain before code, not after

## Documentation

- `docs/architecture/` — system overview, database schema, API routes, realtime
- `docs/decisions/` — ADR files (001-009) with context, decision, alternatives, consequences
- `docs/runbooks/` — deploy, onboarding, migrations, troubleshooting, backup
- `docs/system-design.md` — backend data flow, auth flow, appointment lifecycle
- `docs/design-system.md` — colors, typography, spacing, component guidelines
- `docs/plan.md` — master implementation plan

## Deployment

- Push to GitHub → Vercel auto-deploys
- Database migrations: `npx supabase db push --project-ref lavfzixecvbvdqxyiwwl`
- Type generation: `npx supabase gen types typescript --project-id lavfzixecvbvdqxyiwwl > src/lib/types/database.ts`
