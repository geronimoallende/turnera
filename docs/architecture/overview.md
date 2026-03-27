# System Architecture Overview

## High-Level Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────────┐
│   Browser   │────▶│   Vercel     │────▶│  Supabase                   │
│  (Next.js)  │     │  (Hosting)   │     │  nzozdrakzqhvvmdgkqjh       │
│             │◀────│              │◀────│                             │
└─────────────┘     └──────────────┘     │  ┌─────────────────────┐   │
                                         │  │ PostgreSQL           │   │
┌─────────────┐     ┌──────────────┐     │  │ + RLS Policies       │   │
│  WhatsApp   │────▶│   n8n        │────▶│  │ + Realtime           │   │
│  (Patients) │     │  (EasyPanel) │     │  │ + Functions          │   │
│             │◀────│  1 WF/clinic │◀────│  └─────────────────────┘   │
└─────────────┘     └──────────────┘     │  ┌─────────────────────┐   │
                                         │  │ Auth (email/pass)    │   │
                                         │  │ Staff-only login     │   │
                                         │  └─────────────────────┘   │
                                         │  ┌─────────────────────┐   │
                                         │  │ Storage              │   │
                                         │  │ (logos, documents)   │   │
                                         │  └─────────────────────┘   │
                                         └─────────────────────────────┘
```

## Data Flow

1. **Staff logs in** → Supabase Auth → JWT with `auth.uid()` → RLS filters data by clinic
2. **Staff creates appointment** → Next.js API route → Supabase INSERT → Realtime broadcasts to other tabs
3. **Patient contacts via WhatsApp** → n8n workflow (per-clinic) → calls Next.js API route (`/api/chatbot/*`) → API route uses Supabase admin client → Book/cancel/confirm
4. **Reminder system** → n8n scheduled workflow (per-clinic) → calls Next.js API route → Checks upcoming appointments → Sends WhatsApp/email via BSP

## n8n ↔ API Communication

n8n does NOT talk to Supabase directly. It calls our Next.js API routes instead. This ensures business logic (overlap checks, blacklist validation, overbooking limits) lives in ONE place — the API routes.

```
n8n workflow                         Next.js API route
─────────────                        ──────────────────
Receives WhatsApp msg
Parses patient intent
    │
    ├─► POST /api/chatbot/book  ──►  Check blacklist
        { clinic_id,                  Check overlap
          patient_phone,              Check overbooking limit
          doctor_id,                  Create patient (upsert by DNI)
          date, time }                Create appointment
                                      Create reminder
        x-webhook-secret header       Update waitlist
                                          │
                                          ▼
                                      Supabase (admin client,
                                      bypasses RLS)
```

Authentication: `x-webhook-secret` header validated against `process.env.N8N_WEBHOOK_SECRET`. Inside the route, a Supabase admin client (service_role key) is used because n8n is not a logged-in user.

## Multi-Tenant Isolation

- Global entities: `patients`, `staff`, `doctors` (shared across clinics)
- Junction tables: `clinic_patients`, `staff_clinics`, `doctor_clinic_settings` (per-clinic metadata)
- Per-clinic entities: `appointments`, `waitlist`, `reminders`, etc. (always have `clinic_id`)
- RLS enforces isolation: `clinic_id = ANY(get_user_clinic_ids())`
- n8n goes through API routes; API routes use admin client with explicit `clinic_id` in every query

## Frontend Architecture

- Next.js 14 App Router
- `ClinicProvider` holds active `clinic_id` — all queries filter by it
- `AuthProvider` holds user session + role at active clinic
- Multi-clinic staff see a Clinic Switcher in the topbar
- Supabase Realtime subscriptions scoped to active `clinic_id`
