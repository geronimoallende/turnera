# System Architecture Overview

## High-Level Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────────┐
│   Browser   │────▶│   Vercel     │────▶│  Supabase                   │
│  (Next.js)  │     │  (Hosting)   │     │  lavfzixecvbvdqxyiwwl       │
│             │◀────│              │◀────│                             │
└─────────────┘     └──────────────┘     │  ┌─────────────────────┐   │
                      anon key + JWT     │  │ PostgreSQL           │   │
                                         │  │ + RLS Policies       │   │
┌─────────────┐     ┌──────────────┐     │  │ + Realtime           │   │
│  WhatsApp   │────▶│  YCloud BSP  │────▶│  │ + pgvector           │   │
│  (Patients) │     │  (routing)   │     │  │ + Functions          │   │
│             │◀────│              │◀────│  └─────────────────────┘   │
└─────────────┘     └──────┬───────┘     │  ┌──────────────┐          │
                           │             │  │ Auth          │          │
                           ▼             │  │ (staff-only)  │          │
                    ┌──────────────┐     │  └──────────────┘          │
                    │  VPS (Docker)│────▶│  ┌──────────────┐          │
                    │  FastAPI     │     │  │ Storage       │          │
                    │  + LangChain │◀────│  │ (logos, docs) │          │
                    │  + Celery    │     │  └──────────────┘          │
                    │  + Redis     │     └─────────────────────────────┘
                    └──────────────┘
                      service_role key
```

## Data Flow

1. **Staff logs in** → Supabase Auth → JWT with `auth.uid()` → RLS filters data by clinic
2. **Staff creates appointment** → Next.js API route → Supabase INSERT → Realtime broadcasts to other tabs
3. **Patient sends WhatsApp** → YCloud BSP → FastAPI webhook on VPS → LangChain AI agent → calls Supabase directly (service_role key) → Book/cancel/confirm → responds via YCloud API
4. **Automated reminders** → Celery Beat (cron) → Celery Worker → queries Supabase for pending reminders → sends WhatsApp via YCloud → updates reminders table
5. **Patient asks FAQ** → WhatsApp → FastAPI → LangChain agent → RAG search (pgvector filtered by clinic_id) → LLM generates answer → WhatsApp response

## Python AI Backend ↔ Supabase Communication

The Python backend talks **directly** to Supabase with the `service_role` key (bypasses RLS). There is no Next.js middleman. Database triggers enforce all business rules regardless of caller:

- `check_appointment_overlap()` — prevents double-booking
- `check_payment_update()` — restricts payment changes to admin/secretary
- `update_no_show_count()` — auto-increments no-show count

Authentication for the webhook endpoint uses YCloud's HMAC-SHA256 signature verification on each request.

## Multi-Tenant Isolation

- Global entities: `staff`, `doctors` (shared across clinics)
- Junction tables: `staff_clinics`, `doctor_clinic_settings` (per-clinic metadata)
- Per-clinic entities: `appointments`, `waitlist`, `reminders`, `clinic_patients`, `clinic_faqs`, `clinic_services`, `document_embeddings`, `conversation_sessions`, etc. (always have `clinic_id`)
- RLS enforces isolation for web UI: `clinic_id = ANY(get_user_clinic_ids())`
- Python backend includes `clinic_id` explicitly in every query (service_role bypasses RLS)
- RAG vector search filtered by `clinic_id` — each clinic's knowledge base is isolated

## Frontend Architecture

- Next.js 14 App Router
- `ClinicProvider` holds active `clinic_id` — all queries filter by it
- `AuthProvider` holds user session + role at active clinic
- Multi-clinic staff see a Clinic Switcher in the topbar
- Supabase Realtime subscriptions scoped to active `clinic_id`
