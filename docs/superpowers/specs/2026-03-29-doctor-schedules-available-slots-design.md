# Spec B: Doctor Section + Schedule Configuration + Available Slots

**Date:** 2026-03-29
**Status:** Approved
**Scope:** Week 2 Spec B — Full doctors section with schedule management and `get_available_slots` wiring. No FullCalendar, no appointment booking (those are Week 3).

---

## What We're Building

A complete `/doctors` section where admins and doctors can manage weekly schedules, add overrides (vacations, sick days), and preview available appointment slots. Also wires the existing `get_available_slots` database function to an API route for use by the chatbot and the upcoming appointment booking UI.

### What's NOT in This Spec

- FullCalendar views (Week 3)
- Appointment booking/CRUD (Week 3)
- Secretary calendar flow (Week 3)
- Doctor creation (handled by `create-user.ts` script — doctors need auth accounts)

---

## Pages

### 1. Doctor List (`/doctors`)

Read-only list of doctors at the current clinic. Same pattern as `/patients`.

- **Table columns:** Name, Specialty, License #, Status (active/inactive)
- **No "Add Doctor" button** — doctors are created via CLI script (`create-user.ts`) because they need Supabase Auth accounts
- **Clicking a row** navigates to `/doctors/[id]`
- **Doctor role filter:** Doctors with role `doctor` only see themselves in the list. Admin and secretary see all doctors at the clinic.

### 2. Doctor Detail (`/doctors/[id]`)

Single page with distinct sections. The `[id]` is the `doctors.id` UUID.

#### Section: Profile

Doctor identity data from `staff` + `doctors` tables.

| Field | Type | Editable by |
|-------|------|-------------|
| Full Name | text | Admin, own doctor |
| Email | text (read-only display) | — |
| Specialty | text | Admin, own doctor |
| License Number | text | Admin, own doctor |

- Secretary sees this as read-only
- Save button only visible to admin or the doctor themselves

#### Section: Clinic Settings

Per-clinic configuration from `doctor_clinic_settings`.

| Field | Type | Editable by |
|-------|------|-------------|
| Default Slot Duration | select (15/20/30/45/60 min) | Admin only |
| Max Daily Appointments | number (null = unlimited) | Admin only |
| Consultation Fee | number (decimal) | Admin only |
| Allows Overbooking | toggle | Admin only |
| Max Overbooking Slots | number (visible only if overbooking on) | Admin only |

- Doctors and secretaries see this as read-only
- Only admin can modify

#### Section: Weekly Schedule

Row-based editor for `doctor_schedules` table. Each row = one time block.

```
Day           Start    End      Slot Duration   Active   Actions
─────────────────────────────────────────────────────────────────
Monday        08:00    12:00    30 min          [✓]      [Delete]
Monday        16:00    20:00    30 min          [✓]      [Delete]
Tuesday       09:00    17:00    30 min          [✓]      [Delete]
Wednesday     (no schedule configured)
Thursday      08:00    12:00    30 min          [✓]      [Delete]
Friday        08:00    12:00    30 min          [✓]      [Delete]
Saturday      (no schedule configured)
Sunday        (no schedule configured)

[+ Add Time Block]
```

- **"+ Add Time Block" form:** Day dropdown, start time, end time, slot duration (defaults to clinic setting), valid_from date (defaults to today), valid_until date (optional)
- **Split shifts:** A doctor can have multiple blocks per day (e.g., morning + afternoon)
- **Editable by:** Admin and the doctor themselves
- **Secretary:** Read-only view
- **Validation:** end_time must be after start_time. No overlapping blocks for the same day.

#### Section: Schedule Overrides

List of upcoming overrides from `schedule_overrides` + form to add new ones.

```
Date          Type        Time Range     Reason          Actions
───────────────────────────────────────────────────────────────
2026-04-05    Block       Full day       Vacation        [Delete]
2026-04-10    Block       08:00-12:00    Conference      [Delete]
2026-04-15    Available   14:00-18:00    Extra hours     [Delete]

[+ Add Override]
```

- **"+ Add Override" form:** Date picker, type (block/available), start/end time (optional — null = full day), reason (optional)
- **Override date** must be within the booking window (today → today + `max_booking_days_ahead`)
- Past overrides are hidden (only show upcoming)
- **Editable by:** Admin and the doctor themselves
- **Secretary:** Read-only view

#### Section: Slots Preview

A "Check Availability" tool to verify the schedule works correctly.

- **Date picker:** Constrained from today to today + `max_booking_days_ahead` (60 days default)
- **Calls** `/api/doctors/[id]/available-slots?date=YYYY-MM-DD`
- **Displays** a grid of time chips:
  - Green chip = available slot (shows time range, e.g., "08:00 - 08:30")
  - Gray chip = booked slot (shows time range + "Booked" label)
- **All roles** can view this section
- **Purpose:** Verify the schedule is configured correctly before Week 3's appointment booking

---

## API Routes

All routes require authentication. `clinic_id` comes from query params or request body.

### Doctors

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `GET /api/doctors?clinic_id=xxx` | GET | List doctors at clinic | All roles |
| `GET /api/doctors/[id]?clinic_id=xxx` | GET | Doctor profile + clinic settings | All roles |
| `PUT /api/doctors/[id]` | PUT | Update doctor profile (specialty, license) | Admin or own doctor |
| `PUT /api/doctors/[id]/settings` | PUT | Update clinic settings (fee, slots, overbooking) | Admin only |

**GET `/api/doctors`** returns:
```typescript
{
  data: Array<{
    id: string            // doctors.id
    staff_id: string
    full_name: string     // from staff table
    email: string         // from staff table
    specialty: string
    license_number: string
    is_active: boolean    // from doctor_clinic_settings
    consultation_fee: number | null
    default_slot_duration_minutes: number
  }>
}
```

**GET `/api/doctors/[id]`** returns the same fields plus all `doctor_clinic_settings` fields.

### Schedules

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `GET /api/doctors/[id]/schedules?clinic_id=xxx` | GET | List weekly schedule blocks | All roles |
| `POST /api/doctors/[id]/schedules` | POST | Add a schedule block | Admin or own doctor |
| `PUT /api/doctors/[id]/schedules/[scheduleId]` | PUT | Update a schedule block | Admin or own doctor |
| `DELETE /api/doctors/[id]/schedules/[scheduleId]` | DELETE | Remove a schedule block | Admin or own doctor |

**POST body:**
```typescript
{
  clinic_id: string,
  day_of_week: number,      // 0-6 (0=Sunday)
  start_time: string,       // "08:00"
  end_time: string,         // "12:00"
  slot_duration_minutes: number,  // defaults to doctor_clinic_settings.default_slot_duration_minutes
  valid_from?: string,      // date, defaults to today
  valid_until?: string      // date, null = indefinite
}
```

**Validation:**
- `end_time > start_time`
- No overlapping schedule blocks for the same doctor+clinic+day_of_week (where date ranges overlap)

### Overrides

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `GET /api/doctors/[id]/overrides?clinic_id=xxx` | GET | List upcoming overrides | All roles |
| `POST /api/doctors/[id]/overrides` | POST | Add an override | Admin or own doctor |
| `DELETE /api/doctors/[id]/overrides/[overrideId]` | DELETE | Remove an override | Admin or own doctor |

**POST body:**
```typescript
{
  clinic_id: string,
  override_date: string,         // "2026-04-05"
  override_type: "block" | "available",
  start_time?: string,           // null = full day
  end_time?: string,             // null = full day
  reason?: string                // "Vacation", "Conference"
}
```

**Validation:**
- `override_date` must be today or in the future
- `override_date` must be within `max_booking_days_ahead` from today
- If both times provided, `end_time > start_time`

### Available Slots

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `GET /api/doctors/[id]/available-slots?clinic_id=xxx&date=YYYY-MM-DD` | GET | Get slots for a date | All roles |

- Calls the existing `get_available_slots(p_doctor_id, p_date, p_clinic_id)` Supabase RPC function
- **Booking window validation:** Rejects if date > today + `max_booking_days_ahead`. The `min_booking_hours_ahead` is NOT enforced here (it applies per-slot at booking time in Week 3, since it depends on the slot's actual datetime, not just the date)
- Returns: `{ data: Array<{ slot_start: string, slot_end: string, is_available: boolean, existing_appointment_id: string | null }> }`

---

## Database Migration

One new migration to add booking window columns to `clinics`:

```sql
-- 016_add_booking_window.sql
ALTER TABLE clinics
  ADD COLUMN max_booking_days_ahead INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN min_booking_hours_ahead INTEGER NOT NULL DEFAULT 2;

COMMENT ON COLUMN clinics.max_booking_days_ahead IS 'Maximum days in the future an appointment can be booked. Default 60 (industry standard for medical). Prevents bot errors booking years ahead.';
COMMENT ON COLUMN clinics.min_booking_hours_ahead IS 'Minimum hours before appointment time that booking is allowed. Default 2. Prevents last-second chaos.';
```

No changes needed to `get_available_slots` — booking window validation happens at the API layer.

---

## React Query Hooks

```
src/lib/hooks/use-doctors.ts
```

| Hook | Purpose |
|------|---------|
| `useDoctors(clinicId)` | Fetch list of doctors at clinic |
| `useDoctor(doctorId, clinicId)` | Fetch single doctor with clinic settings |
| `useUpdateDoctor(doctorId)` | Mutation: update doctor profile |
| `useUpdateDoctorSettings(doctorId)` | Mutation: update clinic settings |
| `useDoctorSchedules(doctorId, clinicId)` | Fetch weekly schedule blocks |
| `useCreateSchedule(doctorId)` | Mutation: add schedule block |
| `useUpdateSchedule(doctorId, scheduleId)` | Mutation: update schedule block |
| `useDeleteSchedule(doctorId, scheduleId)` | Mutation: delete schedule block |
| `useDoctorOverrides(doctorId, clinicId)` | Fetch upcoming overrides |
| `useCreateOverride(doctorId)` | Mutation: add override |
| `useDeleteOverride(doctorId, overrideId)` | Mutation: delete override |
| `useAvailableSlots(doctorId, clinicId, date)` | Fetch slots for a date |

All mutations invalidate relevant query caches on success.

---

## Components

```
src/components/doctors/
├── doctor-table.tsx          # Table for /doctors list page
├── doctor-profile-form.tsx   # Profile section (name, specialty, license)
├── clinic-settings-form.tsx  # Clinic settings section (fee, slots, overbooking)
├── schedule-editor.tsx       # Weekly schedule row-based editor
├── override-manager.tsx      # Override list + add form
└── slots-preview.tsx         # Date picker + slot chips grid
```

---

## Permissions Summary

| Section | Admin | Doctor (own) | Secretary |
|---------|-------|-------------|-----------|
| Doctor list | View all | View self only | View all |
| Profile | Edit any | Edit own | Read-only |
| Clinic Settings | Edit any | Read-only | Read-only |
| Weekly Schedule | Edit any | Edit own | Read-only |
| Overrides | Edit any | Edit own | Read-only |
| Slots Preview | View | View | View |

---

## Booking Window Limits

Per-clinic settings stored in `clinics` table:

| Setting | Default | Purpose |
|---------|---------|---------|
| `max_booking_days_ahead` | 60 | Max days into future for booking. Industry standard: Zocdoc 2 weeks, Doctolib 4-6 weeks, Jane App 3 months. 60 days covers the medical sweet spot. |
| `min_booking_hours_ahead` | 2 | Min hours before slot time. Prevents last-second bookings. Industry standard: 2-4 hours. |

Enforced at the API layer in:
- `/api/doctors/[id]/available-slots` — rejects out-of-range dates
- `/api/doctors/[id]/overrides` — rejects override dates outside window
- Week 3's appointment booking endpoints (future)
- Chatbot endpoints (future)

---

## UI Design

Follows the existing flat blue/white design system:
- White background, `#e5e5e5` borders, no shadows
- Blue-500 buttons, blue-800 headings
- `#1a1a1a` text, gray-500 secondary text
- Status chips: green (available), gray (booked/inactive)
- Forms use the same pattern as patient forms (react-hook-form + zod)
- Use `/frontend-design` skill for all component implementation

---

## File Structure

```
src/app/(dashboard)/doctors/
├── page.tsx                          # List page
└── [id]/
    └── page.tsx                      # Detail page (all sections)

src/app/api/doctors/
├── route.ts                          # GET list
└── [id]/
    ├── route.ts                      # GET detail, PUT profile
    ├── settings/
    │   └── route.ts                  # PUT clinic settings
    ├── schedules/
    │   ├── route.ts                  # GET list, POST create
    │   └── [scheduleId]/
    │       └── route.ts              # PUT update, DELETE remove
    ├── overrides/
    │   ├── route.ts                  # GET list, POST create
    │   └── [overrideId]/
    │       └── route.ts              # DELETE remove
    └── available-slots/
        └── route.ts                  # GET slots for date

src/components/doctors/
├── doctor-table.tsx
├── doctor-profile-form.tsx
├── clinic-settings-form.tsx
├── schedule-editor.tsx
├── override-manager.tsx
└── slots-preview.tsx

src/lib/hooks/
└── use-doctors.ts                    # All doctor-related hooks

supabase/migrations/
└── 016_add_booking_window.sql        # New columns on clinics table
```
