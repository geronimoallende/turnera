# Turnera — Architecture Design Spec

## Date: 2026-03-16

## Summary

Multi-tenant medical appointment scheduling SaaS. Staff-only auth (admin, secretary, doctor). Patients have no accounts. WhatsApp chatbot via n8n (one workflow per clinic). Deployed on Vercel via GitHub push.

---

## Decisions Made

| Decision | Choice | ADR |
|----------|--------|-----|
| Data model for patients/doctors | Global + junction table (per-clinic metadata) | 005 |
| Multi-tenancy | Row-level isolation via `clinic_id` + RLS | 002 |
| Auth | Staff-only (admin/doctor/secretary). No patient login. | 003 |
| n8n workflows | One per clinic (isolated failures, per-clinic WhatsApp) | 006 |
| Payment marking | Secretary + admin only. Doctor sees read-only. | 007 |
| WhatsApp connection | External BSP (YCloud or similar) initially. Embedded Signup deferred. | 008 |
| Billing/subscriptions | Skip entirely for now | 009 |
| Chatbot approach | Decide later (rule-based vs AI) | — |
| Backend architecture | Next.js API routes (mobile-ready) | — |
| Data fetching | React Query (TanStack Query) | — |
| Calendar | Custom in Supabase + FullCalendar | 001 |
| Tech stack | Next.js 14 + TypeScript + Supabase + shadcn/ui | 004 |

---

## Architecture

### System Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────────┐
│   Browser   │────▶│   Vercel     │────▶│  Supabase                   │
│  (Next.js)  │     │  (Hosting)   │     │  nzozdrakzqhvvmdgkqjh       │
│             │◀────│              │◀────│                             │
└─────────────┘     └──────────────┘     │  ┌─────────────────────┐   │
                                         │  │ PostgreSQL + RLS     │   │
┌─────────────┐     ┌──────────────┐     │  │ + Realtime           │   │
│  WhatsApp   │────▶│   n8n        │────▶│  │ + Functions          │   │
│  (via BSP)  │     │  (EasyPanel) │     │  └─────────────────────┘   │
│             │◀────│  1 WF/clinic │◀────│  ┌─────────────────────┐   │
└─────────────┘     └──────────────┘     │  │ Auth (staff only)    │   │
                                         │  └─────────────────────┘   │
┌─────────────┐                          │  ┌─────────────────────┐   │
│  Future     │─ ─ ─ ─ calls same ─ ─ ▶ │  │ Storage              │   │
│  Mobile App │      /api/ endpoints     │  └─────────────────────┘   │
└─────────────┘                          └─────────────────────────────┘
```

### Data Flow

1. Staff logs in → Supabase Auth → JWT with `auth.uid()`
2. Frontend uses React Query to call Next.js API routes
3. API routes query Supabase with the user's JWT (RLS filters by clinic)
4. Supabase Realtime broadcasts changes to all connected clients

### n8n Authentication

n8n calls Next.js API routes (NOT Supabase directly). Authentication flow:
1. n8n sends request to `/api/chatbot/*` with `x-webhook-secret` header
2. API route middleware validates the secret matches `process.env.N8N_WEBHOOK_SECRET`
3. Inside the API route, a Supabase **admin client** (using `service_role` key) is used to bypass RLS
4. The API route always includes `clinic_id` in every query (received from n8n in the request body)

This way all business logic (overlap checks, patient upsert, waitlist updates) stays centralized in the API routes.

### Why Next.js API Routes (Not Separate Backend)

- One codebase, one deployment on Vercel
- Mobile app can call the same `/api/` endpoints later
- No extra infrastructure to manage
- Serverless = scales automatically

### Why React Query (Not Plain Fetch)

- Automatic caching (navigate away and back = instant, no re-fetch)
- Automatic loading/error states
- Cache invalidation after mutations (create appointment → calendar refreshes)
- Automatic refetch on tab focus
- Works with React Native for future mobile app

---

## Database Schema

### Entity Types

| Type | Tables | Has clinic_id? | Why |
|------|--------|-----------------|-----|
| Global | `patients`, `staff`, `doctors` | No | Shared across clinics. A patient can visit multiple clinics. |
| Junction | `clinic_patients`, `staff_clinics`, `doctor_clinic_settings` | Yes | Per-clinic metadata. Blacklist, role, fees, etc. |
| Per-clinic | `appointments`, `waitlist`, `reminders`, `doctor_schedules`, `schedule_overrides`, `appointment_history` | Yes | Always belong to one clinic. |

### Tables (13)

1. **`clinics`** — Tenant config, business hours, cancellation policy, WhatsApp BSP credentials
2. **`staff`** — Staff identity (auth link, name, email, phone)
3. **`staff_clinics`** — Staff ↔ Clinic + role (admin/doctor/secretary). One person can have different roles at different clinics.
4. **`doctors`** — Doctor profile (specialty, license number). No per-clinic data here.
5. **`doctor_clinic_settings`** — Per-clinic doctor config (fee, slot duration, overbooking, virtual_enabled, virtual_link, max_daily_appointments)
6. **`patients`** — Patient identity (DNI unique key, name, phone, DOB, gender, blood type, allergies)
7. **`clinic_patients`** — Per-clinic patient metadata (blacklist status, no-show count, insurance, financial status, tags, notes). A patient blacklisted at Clinic A is NOT blacklisted at Clinic B.
8. **`doctor_schedules`** — Weekly recurring availability (day_of_week, start/end time, slot duration)
9. **`schedule_overrides`** — One-off exceptions (block/available, with reason)
10. **`appointments`** — Core table (doctor, patient, date, time, status, modality, source, notes, payment, billing)
11. **`waitlist`** — Patients waiting for openings (preferred date/time range, urgency)
12. **`appointment_history`** — Immutable audit log (action, old/new values, who, when)
13. **`reminders`** — Communication tracking (type, channel, status, response)

### Database Functions

| Function | Type | Purpose |
|----------|------|---------|
| `get_user_clinic_ids()` | Helper | Returns UUID[] of user's clinics (for RLS) |
| `get_user_role(clinic_id)` | Helper | Returns role at specific clinic |
| `get_available_slots(doctor_id, date, clinic_id)` | Query | Returns time slots with availability |
| `check_appointment_overlap()` | Trigger | Prevents double-booking (unless is_overbooking) |
| `check_payment_update()` | Trigger | Only admin/secretary can change payment_status |
| `update_no_show_count()` | Trigger | Auto-increments clinic_patients.no_show_count |

### RLS Pattern

- All per-clinic tables: `clinic_id = ANY(get_user_clinic_ids())`
- Global `patients` table SELECT: `id IN (SELECT patient_id FROM clinic_patients WHERE clinic_id = ANY(get_user_clinic_ids()))`
- Global `patients` table INSERT: any authenticated staff can create (must also create `clinic_patients` row in same transaction)
- Write restrictions by role via `get_user_role(clinic_id)`
- n8n goes through API routes which use `service_role` admin client (bypasses RLS)

### Slot Duration Precedence

`doctor_schedules.slot_duration_minutes` overrides `doctor_clinic_settings.default_slot_duration_minutes`. The clinic setting is the fallback when creating a new schedule row.

---

## Auth & Roles

Only staff logs in. Patients have no accounts.

| Capability | Admin | Secretary | Doctor |
|-----------|-------|-----------|--------|
| View calendar (all doctors) | Yes | Yes | Own only |
| Create/cancel appointments | Yes | Yes | Own only |
| Manage patients (CRUD) | Yes | Yes | Read only |
| Mark payments | Yes | Yes | No (read-only) |
| Manage doctor schedules | Yes | No | Own only |
| View reports | Yes | Yes | Own only |
| Manage staff + clinic settings | Yes | No | No |

---

## WhatsApp Integration

### Initial Approach: External BSP (YCloud or similar)

- Becoming a Meta Tech Provider is difficult → use external BSP first
- Each clinic connects via the BSP's platform
- BSP credentials stored in `clinics` table (api_key, phone_number_id)
- n8n workflows use BSP's API to send/receive messages
- Coexistence mode: clinic keeps WhatsApp Business app while API runs in parallel

### Future: Meta Tech Provider + Embedded Signup

- When/if we become a Meta Tech Provider
- Embedded Signup flow in the dashboard settings
- Direct WABA management without BSP

---

## Chatbot

- **ChatPanel** component embedded in dashboard (collapsible right panel)
- Placeholder UI for now ("Chatbot coming soon")
- API endpoints pre-built for n8n to call
- One n8n workflow per clinic (isolated failures, per-clinic WhatsApp number)
- Approach (rule-based vs AI) decided when we build it

---

## UI Design

- **Base**: shadcn/ui (Radix + Tailwind) — neutral, unstyled
- **Colors**: White background, gray-50/100 cards, minimal blue accent
- **Typography**: Inter or system font stack
- **Status colors**: Green (confirmed), Yellow (pending), Red (cancelled/emergency), Gray (no-show)
- **Why white/simple**: Each clinic can customize later. Neutral base is easier to theme.

---

## Deployment

- GitHub push → Vercel auto-deploy
- Database migrations: `supabase db push`
- Type generation: `supabase gen types typescript`
- No billing system needed yet

---

## What We're NOT Building (Yet)

- Patient self-service portal (Phase 4)
- Billing/subscription management
- Google Calendar sync (Phase 4)
- Meta Tech Provider / Embedded Signup
- AI chatbot (approach TBD)
- Mobile app (architecture supports it when ready)
