# Week 4 Design Spec — Appointments + FullCalendar

> **Date**: 2026-04-04
> **Status**: Approved
> **Scope**: Appointment CRUD, calendar views, booking flow, doctor queue, realtime, drag-and-drop

---

## 1. Overview

Week 4 builds the appointment system — the core of Turnera. Everything before this (auth, patients, doctors, schedules) was setup. This is what secretaries will use 8 hours/day.

**Key constraint**: Secretary books 40-80 calls/day. Booking flow must complete in 3-4 clicks, under 3 seconds.

**What already exists in the database**:
- `appointments` table with all fields (status, modality, source, payment, insurance, timestamps)
- `appointment_history` audit log
- `reminders` table
- `get_available_slots()` function
- `check_appointment_overlap()` trigger (prevents double-booking, allows overbooking)
- `check_payment_update()` trigger (admin/secretary only)
- `update_no_show_count()` trigger
- RLS policies for appointments
- Realtime publication enabled
- FullCalendar packages installed

**What needs to be built**: API routes, React Query hooks, calendar UI, side panel, booking flow, doctor queue view, realtime subscriptions.

---

## 2. Database Changes

### 2.1 Migration 019: Status Enum + Entreturno + Rendicion

Add `otorgado` and `cancelled_clinic` to the `appointment_status` enum:

```sql
ALTER TYPE appointment_status ADD VALUE 'otorgado';
ALTER TYPE appointment_status ADD VALUE 'cancelled_clinic';
```

Add columns to `appointments`:

```sql
ALTER TABLE appointments ADD COLUMN is_entreturno BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN coseguro_amount NUMERIC(10,2);
ALTER TABLE appointments ADD COLUMN order_number TEXT;
```

`otorgado` is not used in Phase 1 UI (all bookings start as `confirmed`). It's added now for the WhatsApp confirmation flow in Phase 2.

### 2.2 Doctor Permission Columns

Add to `doctor_clinic_settings`:

```sql
ALTER TABLE doctor_clinic_settings ADD COLUMN can_create_appointments BOOLEAN DEFAULT false;
ALTER TABLE doctor_clinic_settings ADD COLUMN can_cancel_appointments BOOLEAN DEFAULT false;
```

Admin-controlled per doctor per clinic. Default: doctors have read-only calendar access.

---

## 3. Status Workflow

### 3.1 Phase 1 Flow (Secretary Books)

```
Secretary books → confirmed
Secretary marks → arrived (patient in waiting room)
Doctor/Secretary → in_progress (consultation started)
Doctor/Secretary → completed (consultation finished)
```

Cancel branches at any point before `completed`:
- `cancelled_patient` — patient cancels
- `cancelled_doctor` — doctor cancels
- `cancelled_clinic` — clinic cancels (e.g., doctor sick day)
- `rescheduled` — moved to new time (creates new appointment)

No-show: secretary marks `no_show` (triggers `update_no_show_count` on `clinic_patients`).

### 3.2 Valid Transitions

| From | To |
|------|-----|
| confirmed | arrived, cancelled_patient, cancelled_doctor, cancelled_clinic, rescheduled, no_show |
| arrived | in_progress, cancelled_patient, no_show |
| in_progress | completed |

Invalid transitions are rejected by the API (not by DB trigger — simpler to maintain in application code with clear error messages).

### 3.3 Phase 2 Flow (WhatsApp — Future)

```
Secretary/WhatsApp books → otorgado
24h before → Celery sends WhatsApp confirmation
Patient confirms → confirmed
Patient declines/no reply → flagged for secretary
```

Architecture is ready: `otorgado` in enum, `confirmation_sent_at`/`confirmed_at` columns exist, `reminders` table exists. Zero extra code needed now.

---

## 4. API Routes

### 4.1 GET /api/appointments

List appointments for a clinic. Supports filters.

**Query params:**
- `clinic_id` (required)
- `date` — single date (for day view)
- `start_date` + `end_date` — date range (for week/month views)
- `doctor_id` — filter by doctor (optional)
- `status` — filter by status (optional)
- `patient_id` — filter by patient (optional)

**Response:** Array of appointments with joined data:
```typescript
{
  data: Array<{
    id: string
    appointment_date: string
    start_time: string
    end_time: string
    duration_minutes: number
    status: AppointmentStatus
    reason: string | null
    is_overbooking: boolean
    is_entreturno: boolean
    doctor: { id: string, first_name: string, last_name: string, specialty: string }
    patient: { id: string, first_name: string, last_name: string, dni: string, phone: string | null, insurance_provider: string | null, insurance_plan: string | null, no_show_count: number }
  }>
}
```

### 4.2 GET /api/appointments/[id]

Single appointment detail with full patient and doctor info.

### 4.3 POST /api/appointments

Create appointment. Validates:
- Slot is available (the `check_appointment_overlap` trigger is the safety net — always fires on INSERT. The API does NOT pre-check `get_available_slots` to avoid race conditions between two concurrent bookings)
- Doctor is active at clinic
- Patient exists at clinic
- Role permissions (admin/secretary always, doctor only if `can_create_appointments`)

**Body:**
```typescript
{
  clinic_id: string
  doctor_id: string
  patient_id: string
  appointment_date: string  // YYYY-MM-DD
  start_time: string        // HH:MM
  duration_minutes: number
  reason?: string
  internal_notes?: string
  is_entreturno?: boolean
  source?: 'web' | 'phone' | 'whatsapp' | 'walk_in' | 'manual'
}
```

Sets `status = 'confirmed'`, `created_by = current staff id`.

If `is_entreturno = true`, sets `is_overbooking = true` (bypasses overlap trigger).

**Inline patient creation**: If `new_patient` object is provided instead of `patient_id`, create the patient first, then create the appointment. Two DB operations in sequence (patient creation → appointment creation).

```typescript
{
  // ... appointment fields
  new_patient?: {
    dni: string           // required
    first_name: string    // required
    last_name: string     // required
    phone?: string
  }
}
```

### 4.4 PATCH /api/appointments/[id]/status

Change appointment status. Validates transition is valid per the matrix in section 3.2.

**Body:**
```typescript
{
  status: AppointmentStatus
  cancellation_reason?: string  // required for cancel statuses
}
```

Side effects per status change:
- `arrived` → sets `checked_in_at = now()`
- `in_progress` → sets `started_at = now()`
- `completed` → sets `completed_at = now()`, calculates `actual_duration_minutes`
- `no_show` → trigger auto-increments patient's `no_show_count`
- `cancelled_*` → sets `cancelled_at = now()`

Role enforcement:
- `arrived`, `no_show`: admin/secretary only
- `in_progress`, `completed`: admin/secretary + the assigned doctor
- `cancelled_*`: admin/secretary + doctor if `can_cancel_appointments`

### 4.5 PUT /api/appointments/[id]

Update appointment details (reason, notes, duration). Not for status changes.

### 4.6 POST /api/appointments/[id]/reschedule

Creates a new appointment with the new date/time, sets the old one to `rescheduled`, links them via `rescheduled_to_id` / `rescheduled_from_id`.

**Body:**
```typescript
{
  new_date: string      // YYYY-MM-DD
  new_start_time: string // HH:MM
  new_duration_minutes?: number  // defaults to original
}
```

### 4.7 GET /api/appointments/queue

Doctor's patient queue. Returns today's appointments for a specific doctor, grouped by status.

**Query params:**
- `clinic_id` (required)
- `doctor_id` (required)

**Response:**
```typescript
{
  in_progress: Appointment | null
  waiting: Appointment[]      // status = arrived, ordered by checked_in_at
  upcoming: Appointment[]     // status = confirmed, ordered by start_time
  completed: number           // count
  no_shows: number            // count
}
```

---

## 5. React Query Hooks

### 5.1 use-appointments.ts

```typescript
useAppointments(clinicId, filters)        // GET list with filters
useAppointment(id)                        // GET single detail
useCreateAppointment()                    // POST create (mutation)
useUpdateAppointmentStatus()              // PATCH status change (mutation)
useUpdateAppointment()                    // PUT update details (mutation)
useRescheduleAppointment()                // POST reschedule (mutation)
useDoctorQueue(clinicId, doctorId)        // GET queue for doctor view
```

All mutations invalidate `['appointments']` query cache on success.

---

## 6. Calendar UI

### 6.1 Multi-Doctor Day View (Secretary/Admin Default)

**Layout:** Left sidebar (200px) + Calendar grid (flex) + Side panel (360px, conditional).

**Left sidebar:**
- Mini calendar (date picker, highlights today)
- Doctor checkboxes with color dots (toggle columns on/off)
- Status legend

**Calendar grid:**
- Multiple synced FullCalendar instances in a flex row (Approach A — free tier)
- One `<FullCalendar>` per selected doctor
- First instance has navigation controls, others have `headerToolbar={false}`
- Synced via `datesSet` callback → `gotoDate()` on siblings (with guard to prevent infinite loops)
- `timeGridDay` plugin
- `slotDuration='00:15:00'` (15 min grid lines)
- `slotLabelInterval='00:30:00'` (labels every 30 min)
- `selectMirror={true}` (phantom blue block during selection)
- `selectOverlap={false}` (can't select occupied slots)
- `editable={true}` (drag-and-drop rescheduling)
- `snapDuration='00:15:00'`
- `nowIndicator={true}` (red line at current time)
- `businessHours` from doctor schedule data
- Events filtered by doctor: `events.filter(e => e.doctorId === doctorId)`

**Doctor column headers:** Doctor name + specialty, color-coded.

**Max visible columns:** 5. With 6+ doctors at UPCN, sidebar checkboxes control which are visible.

### 6.2 Week View

- Single FullCalendar instance, `timeGridWeek` plugin
- Doctor selector dropdown in header (one doctor at a time — too cramped for multi-column)
- Compact blocks: time + last name only (space constraint)
- Today column highlighted with subtle blue background
- Weekend columns grayed out (unless doctor has Saturday schedule)

### 6.3 Month View

- FullCalendar `dayGridMonth` plugin
- Aggregate data per cell: appointment count + alert badges
- Badges: "{N} appointments" (blue), "{N} pending" (yellow), "{N} no-shows" (red), "Holiday" (amber)
- Click day cell → switches to Day view for that date
- No individual appointment blocks (too small)

### 6.4 Event Block Rendering

Custom `eventContent` renderer:

**Content hierarchy:**
1. Time bold + duration gray
2. Patient name bold
3. Consultation type gray (day view only, not week)

**Status encoding (border-left, 4px):**
| Status | Color | Additional |
|--------|-------|------------|
| confirmed | `#3b82f6` (blue) | — |
| arrived | `#22c55e` (green) | — |
| in_progress | `#15803d` (dark green) | — |
| completed | `#6b7280` (gray) | reduced opacity |
| no_show | `#ef4444` (red) | strikethrough name, reduced opacity |
| cancelled_* | `#6b7280` (gray) | strikethrough name, reduced opacity |
| otorgado | `#f59e0b` (yellow) | Phase 2 |

**Entreturno:** Two blocks side-by-side in the same slot (half width each). "OB" badge on the overbooking block. FullCalendar handles this natively with `slotEventOverlap={false}`.

**Break/blocked time:** Background event with diagonal stripe pattern, "Break" label.

---

## 7. Side Panel

Single reusable panel component (360px, slides from right) with two modes:

### 7.1 New Appointment Mode

Triggered by: clicking empty slot OR clicking "+ New appointment" button.

**Pre-filled (from slot click):** Doctor, date, time. Editable.

**Form fields:**
1. Patient search (autocomplete, debounce 300ms)
   - Search by: DNI (primary), name (secondary), phone (tertiary)
   - Results show: name, DNI, insurance, no-show count
   - "+ New patient" option at bottom of dropdown
2. Consultation type (dropdown: Consultation, Follow-up, Procedure, Emergency)
3. Duration (dropdown: 15, 20, 30, 45, 60 min — default from doctor settings)
4. Time (editable, pre-filled)
5. Notes (textarea, optional)

**Inline new patient form** (expands when "+ New patient" clicked):
- DNI (required)
- First name (required)
- Last name (required)
- Phone (optional)
- "Complete profile later in Patients section" note
- Collapsible "More details" section: insurance, date of birth, email

**Button:** "Book appointment" (or "Create patient & book" for new patient)

**Entreturno flow:** When the secretary clicks on an already-occupied slot, the system asks "Add entreturno?" (only if the doctor has `allows_overbooking = true`). Confirming opens the booking panel with `is_entreturno = true`. The new appointment appears side-by-side with the existing one in the calendar.

### 7.2 Appointment Detail Mode

Triggered by: clicking an existing appointment block.

**Patient info card (gray background):**
- Name, DNI, phone, insurance + plan, no-show count
- "Incomplete profile" banner if missing phone or insurance → link to edit

**Appointment info:**
- Doctor name + specialty
- Date + time range
- Consultation type + status (color-coded text)

**Primary action buttons (full width):**
- "Arrived" (green) — only if status is `confirmed`
- "Start consultation" (dark green) — only if status is `arrived`
- "Complete consultation" (blue) — only if status is `in_progress`
- "No show" (red) — only if status is `confirmed` or `arrived`

Buttons are contextual — only valid next transitions appear.

**Secondary action buttons:**
- "Reschedule" (outline) — opens reschedule sub-flow
- "Cancel" (outline, red text, red border) — requires confirmation dialog with reason

**No emojis on any buttons.**

**Additional sections:**
- Notes (editable textarea)
- "View full patient record →" link

### 7.3 Keyboard Shortcuts

- `Esc` — close side panel
- `Ctrl+N` — open new appointment panel (no slot pre-selected)

---

## 8. Doctor's View

### 8.1 Calendar

Single column FullCalendar (their appointments only). Day view default, week view available. No month view needed.

More detail per block than secretary view: includes insurance provider and status text.

No "+ New appointment" button unless admin has set `can_create_appointments = true`.

### 8.2 Patient Queue

Replaces the side panel for doctors. Three sections:

1. **In progress** (green card) — current patient. "Complete consultation" button.
2. **Waiting** (yellow section) — arrived patients, ordered by `checked_in_at`. "Start consultation" button per patient. Shows wait time.
3. **Upcoming** (gray section) — confirmed but not arrived. Shows status badge.

**Footer:** Completed count / Remaining count / No-show count.

**Real-time:** Queue updates automatically when secretary marks "Arrived" (Supabase Realtime subscription on appointments table filtered by doctor_id + today's date).

---

## 9. Drag-and-Drop Rescheduling

FullCalendar `editable={true}` enables drag to move appointments.

**Flow:**
1. Secretary drags appointment block to new time slot
2. Confirmation dialog: "Reschedule [Patient] from [old time] to [new time]?"
3. Confirm → calls POST /api/appointments/[id]/reschedule
4. Cancel → `info.revert()` (block snaps back)

**Constraints:**
- `eventConstraint='businessHours'` — can't drop outside doctor's schedule
- `snapDuration='00:15:00'` — snaps to 15-minute intervals
- Can only drag within the same doctor's column (can't reassign to another doctor via drag)

---

## 10. Realtime

Supabase Realtime subscription on the `appointments` table.

**Subscribe to:**
```typescript
supabase
  .channel('appointments')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'appointments',
    filter: `clinic_id=eq.${clinicId}`
  }, (payload) => {
    // Invalidate React Query cache
    queryClient.invalidateQueries(['appointments'])
  })
  .subscribe()
```

This ensures:
- Two secretaries see the same calendar state (one books → the other sees it appear)
- Doctor's queue updates when secretary marks "Arrived"
- Secretary sees when doctor marks "In progress" or "Completed"

Subscription set up in a `RealtimeProvider` or in the calendar page component. Cleanup on unmount.

---

## 11. Accessibility

### 11.1 Keyboard Navigation

- Tab through calendar slots and appointment blocks
- Enter on empty slot → opens booking panel
- Enter on appointment block → opens detail panel
- Esc → closes panel
- Arrow keys navigate between time slots within a column

### 11.2 Screen Reader

- Appointment blocks: `aria-label="Appointment: [Patient], [Type], [Time], [Status]"`
- Doctor columns: `<section role="region" aria-label="Dr. [Name] schedule">`
- Status changes: `aria-live="polite"` announcements ("Patient Maria Garcia marked as arrived")
- Action buttons: descriptive labels, not just icons

### 11.3 Color Not the Only Signal

Every status has:
- Border-left color
- Text label (status name visible in detail panel)
- Different visual treatment (strikethrough for no-show/cancelled, opacity changes)

---

## 12. Role-Based UI

| Element | Admin | Secretary | Doctor |
|---------|-------|-----------|--------|
| Multi-doctor day view | Yes | Yes | No (own column only) |
| Week/month view | Yes | Yes | Week only (own) |
| Side panel: booking form | Yes | Yes | Only if `can_create_appointments` |
| Side panel: "Arrived" button | Yes | Yes | No |
| Side panel: "No show" button | Yes | Yes | No |
| Side panel: "Start consultation" | Yes | Yes | Yes (own patients) |
| Side panel: "Complete" | Yes | Yes | Yes (own patients) |
| Side panel: "Cancel" | Yes | Yes | Only if `can_cancel_appointments` |
| Side panel: "Reschedule" | Yes | Yes | Only if `can_cancel_appointments` |
| Drag-and-drop | Yes | Yes | Only if `can_cancel_appointments` |
| Patient queue | No | No | Yes |
| Doctor checkboxes sidebar | Yes | Yes | No |

---

## 13. Performance Targets

| Metric | Target |
|--------|--------|
| Booking flow (click to confirmed) | < 3s |
| Calendar render (day, 3-5 doctors) | < 1s |
| Status change (click to visual update) | < 500ms |
| Patient search autocomplete | < 300ms after debounce |
| Realtime update propagation | < 2s |
| API p95 for appointment list | < 500ms |

---

## 14. Out of Scope (Week 4)

- WhatsApp notifications (Phase 2)
- Payment marking UI (Week 5)
- Rendicion / coseguro entry (Week 5)
- Waitlist (Phase 2)
- Recurring appointments (Phase 3)
- Offline support (Phase 3)
- Reports (Week 5)
