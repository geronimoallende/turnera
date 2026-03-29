# Turnera - Medical Appointment Scheduling System

## Context

Althem Group needs a SaaS appointment scheduling system ("turnera") for medical offices. The system must handle appointment CRUD, patient CRM, multi-doctor schedules, automated reminders, chatbot integration (n8n), and analytics — all in a single-page dashboard experience. This builds on Althem's existing infrastructure: Supabase (same project as chatbot SaaS), n8n on EasyPanel, and Vercel for hosting.

**Key decisions:**
- **SaaS multi-tenant** from the start (`clinic_id` isolation via junction tables)
- **Clinic-owned patients**: each clinic owns their patient records independently in `clinic_patients` (no global patient table). DNI is unique per clinic, not globally.
- **Global doctors** with per-clinic metadata via junction tables (a doctor can work at multiple clinics)
- **Per-clinic blacklist**: no-show tracking is per-clinic, Clinic A's blacklist doesn't affect Clinic B
- **Custom calendar in Supabase** (waitlists, overbooking, CRM integration, chatbot queries). Google Calendar sync deferred to Phase 4.
- **Same Supabase project** (`nzozdrakzqhvvmdgkqjh.supabase.co`) alongside existing chatbot tables
- **Next.js 14+ App Router** + shadcn/ui + Tailwind CSS + FullCalendar
- **Staff-only auth**: Only admin, doctor, secretary log in. No patient accounts.
- **One n8n workflow per clinic**: Isolated failures, per-clinic WhatsApp numbers, per-clinic customization
- **Payments marked by secretary/admin only**: Doctors see payment status read-only
- **No reports_cache table**: Reports computed on-the-fly (modest data volumes, simple aggregates)
- **Deployment**: GitHub commits → Vercel auto-deploy

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Calendar UI | @fullcalendar/react (day/week/month views, drag-drop) |
| Forms | react-hook-form + zod |
| Charts | recharts |
| PDF Export | @react-pdf/renderer |
| Database | Supabase (PostgreSQL + RLS + Realtime) |
| Auth | Supabase Auth (email/password) + custom staff roles via `staff_clinics` |
| Chatbot | n8n workflows — one per clinic (CB-6 Appointment Manager, CB-7 Reminder Dispatcher) |
| Hosting | Vercel (frontend) + existing Supabase + existing n8n EasyPanel VPS |
| Dates | date-fns + date-fns-tz (Argentina timezone UTC-3) |

---

## Database Schema (Supabase) — 12 Tables

All tables coexist with existing chatbot tables. Multi-tenant isolation via `clinic_id` + RLS.

### Architecture: Global Entities + Per-Clinic Data

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
│   reminders, appointment_history                    │
└─────────────────────────────────────────────────────┘
```

> **Note:** There is no global `patients` table. Each clinic owns their patient records directly in `clinic_patients`. If a patient visits two clinics, they exist as two separate records. See `docs/decisions/011-clinic-owned-patients.md`.

### Table Details

#### 1. `clinics` — Tenant Configuration

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | TEXT NOT NULL | Display name |
| address | TEXT | Shown in reminders |
| phone, email | TEXT | Clinic contact |
| timezone | TEXT DEFAULT 'America/Argentina/Buenos_Aires' | All times in clinic's local TZ |
| business_hours | JSONB | `{"mon": {"start":"08:00","end":"20:00"}, "sun": null}` |
| cancellation_policy_hours | INTEGER DEFAULT 24 | Late cancellation threshold |
| cancellation_fee_amount | DECIMAL | Fee for late cancellation |
| chatbot_client_id | UUID FK → client_config | Link to existing chatbot SaaS |
| n8n_webhook_url | TEXT | Per-clinic n8n endpoint |
| **WhatsApp (Embedded Signup)** | | |
| whatsapp_number | TEXT | Per-clinic WhatsApp number |
| whatsapp_phone_number_id | TEXT | Meta API: identifies the connected number |
| whatsapp_waba_id | TEXT | Meta API: WhatsApp Business Account ID |
| whatsapp_business_id | TEXT | Meta API: Meta Business Portfolio ID |
| whatsapp_connected_at | TIMESTAMPTZ | When Embedded Signup was completed |
| whatsapp_status | ENUM (not_connected/connected/disconnected) DEFAULT 'not_connected' | Connection state |
| logo_url | TEXT | Dashboard header + PDF exports |
| created_at, updated_at | TIMESTAMPTZ | |

#### 2. `staff` — Global Staff Identity

No `clinic_id` or `role` here — those live in `staff_clinics`.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| auth_user_id | UUID UNIQUE FK → auth.users | Links to Supabase Auth |
| full_name | TEXT NOT NULL | |
| email | TEXT NOT NULL | |
| phone | TEXT | |
| is_active | BOOLEAN DEFAULT true | Global soft-delete |
| created_at, updated_at | TIMESTAMPTZ | |

#### 3. `staff_clinics` — **NEW** Junction: Staff ↔ Clinic + Role

A staff member can work at multiple clinics with different roles.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| staff_id | UUID FK → staff | |
| clinic_id | UUID FK → clinics | |
| role | ENUM (admin/doctor/secretary) | Role at THIS clinic |
| is_active | BOOLEAN DEFAULT true | Per-clinic soft-delete |
| created_at | TIMESTAMPTZ | |
| **UNIQUE** | (staff_id, clinic_id) | One role per clinic |

#### 4. `doctors` — Global Doctor Profile

Only doctor-specific identity data. Per-clinic config lives in `doctor_clinic_settings`.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| staff_id | UUID UNIQUE FK → staff | |
| specialty | TEXT NOT NULL | "Cardiology", "Dermatology" |
| license_number | TEXT NOT NULL | Matricula |
| virtual_enabled | BOOLEAN DEFAULT false | Offers video consultations? |
| virtual_link | TEXT | Zoom/Meet URL |
| created_at, updated_at | TIMESTAMPTZ | |

#### 5. `doctor_clinic_settings` — **NEW** Per-Clinic Doctor Config

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| doctor_id | UUID FK → doctors | |
| clinic_id | UUID FK → clinics | |
| default_slot_duration_minutes | INTEGER DEFAULT 30 | |
| max_daily_appointments | INTEGER | null = unlimited |
| allows_overbooking | BOOLEAN DEFAULT false | |
| max_overbooking_slots | INTEGER | |
| consultation_fee | DECIMAL(10,2) | |
| is_active | BOOLEAN DEFAULT true | |
| created_at, updated_at | TIMESTAMPTZ | |
| **UNIQUE** | (doctor_id, clinic_id) | |

#### 6. `clinic_patients` — Per-Clinic Patient Records

Each clinic owns their patient records independently. There is NO global patient table. If a patient visits two clinics, they exist as two separate records. DNI is unique per clinic, not globally.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| clinic_id | UUID FK → clinics | |
| **Identity** | | |
| first_name | TEXT NOT NULL | |
| last_name | TEXT NOT NULL | |
| dni | TEXT | National ID |
| phone | TEXT | |
| email | TEXT | |
| whatsapp_phone | TEXT | For chatbot matching |
| date_of_birth | DATE | |
| gender | TEXT | |
| blood_type | TEXT | |
| allergies | TEXT | |
| is_active | BOOLEAN DEFAULT true | Soft-delete |
| **Blacklist** | | |
| blacklist_status | ENUM (none/warned/blacklisted) DEFAULT 'none' | Per-clinic! |
| no_show_count | INTEGER DEFAULT 0 | Auto-incremented by trigger |
| **Insurance** | | |
| insurance_provider | TEXT | "OSDE", "Swiss Medical" |
| insurance_plan | TEXT | "OSDE 210" |
| insurance_member_number | TEXT | |
| **CRM** | | |
| patient_type | TEXT | regular/vip/new/referred |
| frequency | TEXT | weekly/monthly/occasional |
| priority | TEXT | |
| financial_status | TEXT | up_to_date/pending/overdue |
| tags | TEXT[] DEFAULT '{}' | ['conflictive', 'prefers_afternoon'] |
| notes | TEXT | Secretary notes about this patient |
| created_at, updated_at | TIMESTAMPTZ | |
| **UNIQUE** | (clinic_id, dni) | DNI unique per clinic only |

#### 7. `doctor_schedules` — Weekly Recurring Availability (Per-Clinic)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| doctor_id | UUID FK → doctors | |
| clinic_id | UUID FK → clinics | Schedule is per-doctor-per-clinic |
| day_of_week | SMALLINT CHECK (0-6) | 0=Sunday |
| start_time, end_time | TIME | CHECK (end > start) |
| slot_duration_minutes | INTEGER DEFAULT 30 | |
| is_active | BOOLEAN DEFAULT true | |
| valid_from | DATE DEFAULT CURRENT_DATE | |
| valid_until | DATE | null = indefinite |
| created_at | TIMESTAMPTZ | |

#### 8. `schedule_overrides` — One-Off Exceptions (Per-Clinic)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| doctor_id | UUID FK → doctors | |
| clinic_id | UUID FK → clinics | |
| override_date | DATE NOT NULL | |
| start_time, end_time | TIME | null = entire day |
| override_type | ENUM (block/available) | block=not available, available=extra hours |
| reason | TEXT | "Vacation", "Conference" |
| created_at | TIMESTAMPTZ | |

#### 9. `appointments` — Core Table

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| clinic_id | UUID FK → clinics | |
| doctor_id | UUID FK → doctors | |
| patient_id | UUID FK → clinic_patients | |
| appointment_date | DATE NOT NULL | Separate from time for indexing |
| start_time, end_time | TIME NOT NULL | |
| duration_minutes | INTEGER NOT NULL | |
| **Status** | | |
| status | ENUM (scheduled/confirmed/arrived/in_progress/completed/no_show/cancelled_patient/cancelled_doctor/rescheduled) DEFAULT 'scheduled' | |
| modality | ENUM (in_person/virtual) DEFAULT 'in_person' | |
| source | ENUM (web/phone/whatsapp/chatbot/walk_in/manual) DEFAULT 'manual' | How it was created |
| **Details** | | |
| reason | TEXT | "Checkup", "Follow-up" |
| doctor_notes | TEXT | Doctor's notes |
| internal_notes | TEXT | Secretary notes |
| pre_consultation_instructions | TEXT | "Come fasting" |
| **Confirmation/Reminders** | | |
| confirmation_sent_at | TIMESTAMPTZ | |
| confirmed_at | TIMESTAMPTZ | |
| reminder_24h_sent_at | TIMESTAMPTZ | |
| reminder_sameday_sent_at | TIMESTAMPTZ | |
| **Flags** | | |
| is_overbooking | BOOLEAN DEFAULT false | Overlap trigger skips validation |
| is_emergency | BOOLEAN DEFAULT false | Red indicator on calendar |
| **Recurrence** | | |
| recurrence_rule | TEXT | "every 3 months" |
| recurrence_parent_id | UUID FK → appointments | |
| **Cancellation** | | |
| cancelled_at | TIMESTAMPTZ | |
| cancellation_reason | TEXT | |
| cancellation_fee_applied | BOOLEAN DEFAULT false | |
| rescheduled_to_id | UUID FK → appointments | |
| rescheduled_from_id | UUID FK → appointments | |
| **Billing — writable only by admin/secretary (enforced by trigger)** | | |
| payment_status | ENUM (pending/paid/partial/waived) DEFAULT 'pending' | |
| payment_updated_by | UUID FK → staff | Audit: who changed payment |
| payment_updated_at | TIMESTAMPTZ | |
| is_invoiced | BOOLEAN DEFAULT false | |
| invoice_number | TEXT | |
| insurance_auth_status | TEXT | pending/approved/denied/not_required |
| **Timestamps** | | |
| checked_in_at | TIMESTAMPTZ | When patient arrived |
| started_at | TIMESTAMPTZ | When consultation began |
| completed_at | TIMESTAMPTZ | When consultation ended |
| created_by | UUID FK → staff | |
| created_at, updated_at | TIMESTAMPTZ | |

**Indexes**: (clinic_id, appointment_date), (doctor_id, appointment_date), (patient_id)

#### 10. `waitlist`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| clinic_id | UUID FK → clinics | |
| patient_id | UUID FK → clinic_patients | |
| doctor_id | UUID FK → doctors | null = any doctor |
| preferred_date_start/end | DATE | |
| preferred_time_start/end | TIME | |
| urgency | ENUM (urgent/standard/flexible) | |
| status | ENUM (waiting/offered/booked/expired/cancelled) DEFAULT 'waiting' | |
| offered_appointment_id | UUID FK → appointments | |
| created_at, updated_at | TIMESTAMPTZ | |

#### 11. `appointment_history` — Immutable Audit Log

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| appointment_id | UUID FK → appointments | |
| clinic_id | UUID FK → clinics | Denormalized for RLS performance |
| action | TEXT NOT NULL | 'created', 'confirmed', 'cancelled', etc. |
| old_values, new_values | JSONB | Snapshot of changes |
| performed_by | UUID FK → staff | null = system/chatbot |
| performed_by_source | TEXT | 'web_app', 'chatbot', 'n8n', 'system' |
| created_at | TIMESTAMPTZ | |

#### 12. `reminders` — Communication Tracking

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| appointment_id | UUID FK → appointments | |
| clinic_id | UUID FK → clinics | |
| patient_id | UUID FK → clinic_patients | |
| reminder_type | ENUM (confirmation_request/reminder_24h/reminder_sameday/post_consultation) | |
| channel | ENUM (whatsapp/email/sms) | |
| status | ENUM (pending/sent/delivered/read/failed) | |
| response | ENUM (confirmed/cancelled/rescheduled) | Patient's reply |
| sent_at, delivered_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

### Why No `reports_cache` Table

Reports are simple aggregates over modest data volumes:
- A busy clinic: ~100 appointments/day, ~3000/month
- Queries like `COUNT(*) FILTER (WHERE status = 'no_show')` run in milliseconds
- Caching adds staleness and complexity for no benefit at this scale
- If needed later (hundreds of clinics), add materialized views then

---

### Database Functions

#### `get_user_clinic_ids()` — Returns all clinics the current user belongs to
```sql
CREATE OR REPLACE FUNCTION get_user_clinic_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT sc.clinic_id FROM staff_clinics sc
    JOIN staff s ON s.id = sc.staff_id
    WHERE s.auth_user_id = auth.uid() AND sc.is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

#### `get_user_role(p_clinic_id)` — Returns user's role at a specific clinic
```sql
CREATE OR REPLACE FUNCTION get_user_role(p_clinic_id UUID)
RETURNS staff_role AS $$
  SELECT sc.role FROM staff_clinics sc
  JOIN staff s ON s.id = sc.staff_id
  WHERE s.auth_user_id = auth.uid()
    AND sc.clinic_id = p_clinic_id AND sc.is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

#### `get_available_slots(doctor_id, date, clinic_id)` — Slot availability
1. Looks up `doctor_schedules` for that day_of_week + clinic_id
2. Generates time slots via `generate_series`
3. Subtracts `schedule_overrides` (blocks)
4. Subtracts existing `appointments` (booked, not cancelled)
5. Returns: `slot_start`, `slot_end`, `is_available`, `existing_appointment_id`

#### `check_appointment_overlap()` — Trigger
Runs BEFORE INSERT/UPDATE on `appointments`. Raises error if overlap exists for same doctor+clinic+date — unless `is_overbooking = true`.

#### `check_payment_update()` — Trigger
Runs BEFORE UPDATE on `appointments`. If `payment_status` changed, verifies the user is admin or secretary. Auto-fills `payment_updated_by` and `payment_updated_at`.

#### `update_no_show_count()` — Trigger
Runs AFTER UPDATE on `appointments`. When status changes to `no_show`, increments `clinic_patients.no_show_count` for that patient record.

### RLS Policies

All RLS policies use `clinic_id = ANY(get_user_clinic_ids())` for multi-clinic support.

**Key patterns:**
- `clinics`: SELECT where `id = ANY(get_user_clinic_ids())`. UPDATE only if `get_user_role(id) = 'admin'`
- `staff`: SELECT where staff shares any clinic with current user
- `staff_clinics`: SELECT/INSERT/UPDATE restricted to user's clinics, writes require admin role
- `clinic_patients`: Filtered by `clinic_id`. Writes require admin/secretary role. Doctors read-only.
- `appointments`: SELECT filtered by `clinic_id`. INSERT by admin/secretary or doctor (own appointments). Payment updates enforced by trigger.
- `appointment_history`, `reminders`, `waitlist`: Filtered by `clinic_id`
- **n8n**: Uses `service_role` key (bypasses RLS)

### Realtime
- Enable Supabase Realtime on: `appointments` (INSERT/UPDATE/DELETE), `waitlist` (INSERT/UPDATE)

---

## Project Structure

```
turnera/
├── docs/
│   ├── architecture/
│   │   ├── overview.md                  # System architecture diagram
│   │   ├── database-schema.md           # All tables, columns, relationships, RLS
│   │   ├── api-routes.md                # Every API endpoint
│   │   └── realtime.md                  # Realtime setup
│   ├── decisions/
│   │   ├── 001-custom-calendar.md
│   │   ├── 002-multi-tenancy.md
│   │   ├── 003-auth-model.md            # Staff-only, no patient login
│   │   ├── 004-tech-stack.md
│   │   ├── 005-global-patients.md       # (superseded by 011-clinic-owned-patients)
│   │   ├── 006-n8n-per-clinic.md        # One workflow per clinic
│   │   ├── 007-payment-permissions.md   # Secretary/admin only
│   │   └── template.md
│   ├── runbooks/
│   │   ├── deploy.md
│   │   ├── new-clinic-onboarding.md
│   │   ├── database-migration.md
│   │   ├── troubleshooting.md
│   │   └── backup-restore.md
│   ├── system-design.md                 # Backend: data flow, API, auth, cron
│   └── design-system.md                 # UI: typography, colors, spacing
│
├── tools/
│   ├── scripts/
│   │   ├── seed.ts                      # Sample data: 1 clinic, 3 doctors, 50 patients, 200 appointments
│   │   ├── create-user.ts               # Create staff user via CLI
│   │   ├── create-clinic.ts             # Onboard new clinic tenant
│   │   ├── reset-db.ts                  # Reset dev database
│   │   └── generate-types.ts            # Regenerate Supabase TS types
│   └── README.md
│
├── .claude/
│   ├── skills/
│   │   ├── deploy-github.md
│   │   ├── deploy-vercel.md
│   │   ├── explain-code.md
│   │   ├── sync-notion.md
│   │   └── db-migrate.md
│   └── commands/
│
├── supabase/
│   └── migrations/                      # 15 SQL migration files
│       ├── 001_create_enums.sql
│       ├── 002_create_clinics.sql
│       ├── 003_create_staff.sql         # staff + staff_clinics
│       ├── 004_create_doctors.sql       # doctors + doctor_clinic_settings
│       ├── 005_create_patients.sql      # clinic_patients (clinic-owned, no global table)
│       ├── 006_create_schedules.sql     # doctor_schedules + schedule_overrides
│       ├── 007_create_appointments.sql
│       ├── 008_create_waitlist.sql
│       ├── 009_create_history.sql
│       ├── 010_create_reminders.sql
│       ├── 011_create_functions.sql     # get_user_clinic_ids, get_user_role, get_available_slots
│       ├── 012_create_triggers.sql      # overlap check, payment check, no-show counter
│       ├── 013_create_rls_policies.sql
│       ├── 014_enable_realtime.sql
│       └── 015_create_indexes.sql
│
├── src/
│   ├── app/
│   │   ├── (auth)/login/                # Staff-only login (admin/doctor/secretary)
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/               # Today's agenda, stats, alerts
│   │   │   ├── calendar/                # FullCalendar day/week/month
│   │   │   ├── appointments/            # List + new + [id] detail
│   │   │   ├── patients/                # List + search + new + [id] profile
│   │   │   ├── doctors/                 # List + [id] + schedule editor
│   │   │   ├── waitlist/                # Waitlist management
│   │   │   ├── reports/                 # Charts and analytics
│   │   │   └── settings/               # Clinic settings, staff, notifications
│   │   └── api/
│   │       ├── appointments/            # CRUD + available-slots + bulk-cancel
│   │       ├── patients/                # CRUD + search (upsert by DNI)
│   │       ├── waitlist/                # CRUD + offer slot
│   │       ├── reminders/send/          # Trigger reminder batch
│   │       ├── reports/                 # On-the-fly aggregates + export-pdf
│   │       └── chatbot/                 # available-slots, book, cancel, confirm, doctors
│   ├── components/
│   │   ├── ui/                          # shadcn/ui (white/minimal theme)
│   │   ├── layout/                      # Sidebar, Topbar (with clinic switcher), MobileNav
│   │   ├── calendar/                    # CalendarView, DayView, WeekView, MonthView
│   │   ├── appointments/                # AppointmentForm, StatusBadge, QuickBookDialog
│   │   ├── patients/                    # PatientForm, PatientSearch, PatientHistory, BlacklistBadge
│   │   ├── doctors/                     # ScheduleEditor, OverrideManager
│   │   ├── dashboard/                   # TodayOverview, QuickStats, AlertsPanel
│   │   ├── chat/                        # ChatPanel (placeholder, collapsible right panel)
│   │   ├── waitlist/                    # WaitlistTable, OfferSlotDialog
│   │   ├── reports/                     # AttendanceChart, RevenueProjection
│   │   └── shared/                      # DatePicker, TimePicker, ConfirmDialog, ClinicSwitcher
│   ├── lib/
│   │   ├── supabase/                    # client.ts, server.ts, admin.ts
│   │   ├── hooks/                       # useAppointments, usePatients, useAuth, useRealtime, useClinic
│   │   ├── types/                       # database.ts (generated), domain types
│   │   ├── utils/                       # date.ts, calendar.ts, validation.ts, pdf.ts
│   │   └── constants/                   # statuses, routes, config
│   └── providers/                       # AuthProvider, ClinicProvider (multi-clinic), RealtimeProvider
├── middleware.ts                         # Auth redirect + role-based route guards
├── .env.local                           # SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY
├── CLAUDE.md
└── package.json
```

### Auth & Roles

| Capability | Admin | Doctor | Secretary |
|-----------|-------|--------|-----------|
| View calendar (all doctors) | Yes | Own only | Yes |
| Create/cancel/reschedule appointment | Yes | Own only | Yes |
| Mark attended/no-show | Yes | Own only | Yes |
| Manage patients (CRUD) | Yes | Read only | Yes |
| Manage doctor schedules | Yes | Own only | No |
| View reports | Yes | Own only | Yes |
| Manage staff + clinic settings | Yes | No | No |
| **Mark payments** | **Yes** | **Read only** | **Yes** |
| Switch clinics (if multi-clinic) | Yes | Yes | Yes |

---

## WhatsApp Connection

### Phase 1: External BSP (YCloud or similar)
Each clinic connects their WhatsApp number through an external BSP like YCloud. The BSP handles Meta's complexity (Embedded Signup, WABA creation, template approval). We store the resulting credentials.

**Onboarding flow:**
1. Admin goes to **Settings → WhatsApp**
2. Follows link/instructions to connect via BSP's platform (e.g., YCloud)
3. BSP provides: `phone_number_id`, `waba_id`, `business_id`
4. Admin enters credentials in our Settings page (or received via BSP webhook)
5. Status changes to `connected`

### Phase 2 (Future): Own Embedded Signup
When we register as Meta Tech Provider, build our own Embedded Signup directly in the Settings page. Until then, the BSP handles this.

### Coexistence Mode
- Clinic keeps using their WhatsApp Business app normally
- Our API (via BSP) sends/receives messages in parallel on the same number
- When staff replies from the app, bot pauses for a configurable timeout (handoff)
- **Requirement**: Client must open WhatsApp Business app at least every 14 days

### Prerequisites (for the clinic)
- WhatsApp Business App (not personal WhatsApp), version 2.24.17+
- Number active for at least 7 days
- Facebook account

### WhatsApp Message Templates (registered with Meta via BSP)
- **Reminder**: "Hola {{1}}, te recordamos tu turno el {{2}} a las {{3}} con {{4}}. Respondé SI para confirmar o NO para cancelar."
- **Confirmation**: "Tu turno fue confirmado para el {{2}} a las {{3}}."
- **Cancellation**: "Tu turno del {{2}} fue cancelado. ¿Querés reprogramar?"

### No Meta Verification Needed (for most clinics)
- Without verification: 250 business-initiated messages/day (enough for <50 appointments/day)
- Patient-initiated conversations (service messages) are unlimited and free

### UI
- **Settings → WhatsApp**: Connection status, BSP credentials input, connected number display, disconnect option
- **Status badge** in sidebar: green dot if connected, red if disconnected

---

## Chatbot Integration (Future — n8n + Embedded Panel)

The chatbot will be built later in n8n. **One workflow per clinic** for isolation.

For now, the app includes:
- **`ChatPanel` component** embedded in dashboard (collapsible right panel)
- **Placeholder UI** with "Chatbot coming soon"
- **API endpoints ready** for when n8n is connected

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chatbot/available-slots` | GET | Available slots for doctor+date |
| `/api/chatbot/book` | POST | Book appointment (upsert patient by phone/DNI) |
| `/api/chatbot/cancel` | POST | Cancel by patient phone + appointment ID |
| `/api/chatbot/patient-appointments` | GET | Upcoming appointments for phone number |
| `/api/chatbot/doctors` | GET | List doctors with specialties |
| `/api/chatbot/confirm` | POST | Patient confirms via chatbot response |

**Patient creation via chatbot**: Upserts into `clinic_patients` by DNI/phone for that specific clinic. No global patient table involved.

---

## Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│ TOPBAR: Logo | [Clinic Switcher ▼] | "Dr. Martinez" | Notif │
├──────────┬───────────────────────────────────────────────────┤
│ SIDEBAR  │  QUICK STATS: 12 Today | 3 Confirmed |           │
│          │  8 Pending | 1 No-show | 85% Rate                 │
│ Dashboard├───────────────────────────────────────────────────┤
│ Calendar │  TODAY'S AGENDA                                    │
│ Appts    │  08:00 | Garcia, Juan | Checkup | Confirmed       │
│ Patients │  08:30 | Lopez, Maria | Follow-up | Pending       │
│ Waitlist │  09:00 | [AVAILABLE SLOT]                         │
│ Doctors  │  09:30 | Perez, Carlos | Pain | EMERGENCY         │
│ Reports  ├───────────────────────────────────────────────────┤
│ Settings │  ALERTS: 2 unconfirmed | 1 blacklisted patient    │
│          ├───────────────────────────────────────────────────┤
│          │  RECENT ACTIVITY: Cancellations, waitlist          │
└──────────┴───────────────────────────────────────────────────┘
```

Multi-clinic staff see a **Clinic Switcher** dropdown in the topbar. All data updates when switching.

---

## UI Approach

**Sober, blue/white, Obsidian-inspired flat design.** Always use `/frontend-design` skill for UI work.
- **Base**: shadcn/ui (Radix + Tailwind)
- **Sidebar**: Blue-800 (`#1e40af`) background, white text, blue-600 active link
- **Content area**: White background, gray-50 cards, thin 1px borders (`#e5e5e5`)
- **Primary accent**: Blue-500 (`#3b82f6`) for buttons, links, active states
- **Typography**: Inter (or system font stack), near-black (`#1a1a1a`)
- **Style**: Flat (no shadows), compact spacing, minimal color usage, clean
- **Status colors**: Green (confirmed), Yellow (pending), Red (cancelled/emergency), Gray (no-show, completed)
- **Blacklist badge**: Red "Blacklisted" or Yellow "Warned" badge on patient cards

---

## Implementation Phases

### Phase 1: Core MVP (Weeks 1-4)
- **Week 1**: Project setup (Next.js + Supabase + Auth). All 15 database migrations. Login page. Seed script. ✅ DONE
- **Week 2**:
  - **Spec A** — UI restyling (blue sidebar, Obsidian-flat style) + Patient CRUD:
    - Restyle sidebar (blue-800 bg), topbar, login, dashboard, shadcn theme
    - Patient list page: search-first approach (search bar + table, 20/page)
    - Create patient: minimal form (first name, last name, DNI, phone). DNI unique per clinic.
    - Edit patient: full form split in Personal Info + Insurance & Notes sections
    - API routes: GET/POST /api/patients, GET/PUT /api/patients/[id]
    - React Query hooks for data fetching
  - **Spec B** — Doctor schedule configuration + `get_available_slots` wiring (separate spec)
- **Week 3**: Appointment CRUD. FullCalendar views (day/week/month). Quick booking. Appointment detail/edit.
- **Week 4**: Dashboard overview (today's agenda, stats, alerts). Status workflow. Payment marking (secretary/admin). PDF export.

### Phase 2: Communications & WhatsApp (Weeks 5-7)
- **Week 5**: WhatsApp Embedded Signup flow (Settings page, Meta popup, WABA storage). Reminders table.
- **Week 6**: n8n CB-7 Reminder Dispatcher (per-clinic). n8n CB-6 Appointment Manager (per-clinic). Chatbot API endpoints.
- **Week 7**: Waitlist management. Auto-notification on slot opening. Cancellation policy. Blacklist management UI. Bot-to-human handoff logic.

### Phase 3: CRM, Reports & Polish (Weeks 8-10)
- **Week 8**: Patient CRM: family links, tags, classification, no-show history, blacklist management.
- **Week 9**: Reports (on-the-fly aggregates: attendance, revenue, insurance). Recurring appointments.
- **Week 10**: Realtime updates. Multi-clinic switcher polish. Mass cancellation. Overbooking. Settings. Mobile.

### Phase 4: Future
- Google Calendar one-way sync
- Billing system integration
- Document management (lab results)
- Patient self-service portal
- Multi-clinic onboarding flow

---

## Testing & Developer Tools

### Scripts (`tools/scripts/`)
- **`seed.ts`**: 1 clinic, 3 doctors, 50 patients, 200 appointments. `npx tsx tools/scripts/seed.ts`
- **`create-user.ts`**: `npx tsx tools/scripts/create-user.ts --email doc@clinic.com --role doctor --clinic clinica_demo`
- **`create-clinic.ts`**: Onboard new tenant
- **`reset-db.ts`**: Drop and re-run migrations (dev only)
- **`generate-types.ts`**: `supabase gen types typescript`

### Chrome DevTools with Claude
- Use browser MCP to verify layouts, interactions, real-time updates

### TestSprite
- Automated browser testing after Phase 1 for critical flows

---

## Verification Plan

1. **Database**: Run all 15 migrations. Run `seed.ts`. Verify RLS policies and `get_available_slots`.
2. **Auth**: Test login for admin/doctor/secretary. Verify route guards. Verify patients cannot log in.
3. **Multi-clinic**: Create staff linked to 2 clinics. Verify clinic switcher works. Verify data isolation.
4. **Blacklist**: Mark appointment as no-show. Verify `no_show_count` incremented only for that clinic. Verify other clinic sees clean record.
5. **Payments**: Verify doctor CANNOT change payment_status. Verify secretary/admin CAN.
6. **Calendar**: Create appointments. Verify FullCalendar. Test drag-drop. Verify overlap detection.
7. **Chatbot API**: curl `/api/chatbot/available-slots` and `/api/chatbot/book`. Verify patient creation in `clinic_patients` by DNI.
8. **Realtime**: Two tabs, create appointment in one — appears in other.
9. **Reports**: Verify on-the-fly aggregates match seed data.
10. **PDF**: Export daily agenda, verify content.
