# Week 4: Appointments + FullCalendar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the appointment system with calendar views, booking flow, side panel, doctor queue, realtime, and drag-and-drop rescheduling.

**Architecture:** API routes using withErrorHandler pattern → React Query hooks for data fetching → FullCalendar multi-instance approach for multi-doctor day view → reusable side panel for booking and appointment detail → Supabase Realtime for live updates.

**Tech Stack:** Next.js 16 App Router, FullCalendar 6.x (free tier), React Query v5, react-hook-form + zod, Supabase Realtime, date-fns, shadcn/ui, Tailwind CSS.

**Design Spec:** `docs/superpowers/specs/2026-04-04-week4-appointments-fullcalendar-design.md`

---

## File Structure

### New Files

```
supabase/migrations/
  019_add_entreturno_rendicion_permissions.sql    # Status enum + columns + doctor permissions

src/app/api/appointments/
  route.ts                                         # GET list + POST create
src/app/api/appointments/[id]/
  route.ts                                         # GET detail + PUT update
  status/route.ts                                  # PATCH status change
  reschedule/route.ts                              # POST reschedule
src/app/api/appointments/queue/
  route.ts                                         # GET doctor queue

src/lib/hooks/
  use-appointments.ts                              # All appointment React Query hooks

src/app/(dashboard)/calendar/
  page.tsx                                         # Calendar page (day/week/month)

src/components/calendar/
  calendar-header.tsx                              # Navigation, view toggle, new appointment button
  calendar-sidebar.tsx                             # Mini calendar, doctor checkboxes, status legend
  doctor-column.tsx                                # Single FullCalendar instance for one doctor
  multi-doctor-grid.tsx                            # Flex container syncing multiple doctor columns
  event-block.tsx                                  # Custom eventContent renderer
  week-view.tsx                                    # Single FullCalendar week view
  month-view.tsx                                   # FullCalendar month view with aggregate badges

src/components/calendar/side-panel/
  appointment-side-panel.tsx                        # Main panel container (slides from right)
  booking-form.tsx                                  # New appointment form
  appointment-detail.tsx                            # Existing appointment detail + action buttons
  patient-search.tsx                                # Autocomplete search for booking
  inline-patient-form.tsx                           # New patient creation inside booking

src/components/calendar/doctor-view/
  doctor-queue.tsx                                  # Patient queue (waiting room)

src/lib/constants/
  appointment-status.ts                             # Status colors, labels, valid transitions
```

### Modified Files

```
src/lib/types/database.ts                          # Regenerate after migration
src/app/(dashboard)/doctors/[id]/page.tsx           # Add permission toggle in settings form
src/components/doctors/clinic-settings-form.tsx     # Add can_create/cancel_appointments checkboxes
```

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/019_add_entreturno_rendicion_permissions.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- Migration 019: Add entreturno, rendicion, and doctor permission columns
-- Also adds otorgado and cancelled_clinic to appointment_status enum

-- 1. Add new status values to enum
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'otorgado';
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'cancelled_clinic';

-- 2. Add entreturno and rendicion columns to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_entreturno BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS coseguro_amount NUMERIC(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS order_number TEXT;

-- 3. Add doctor permission columns to doctor_clinic_settings
ALTER TABLE doctor_clinic_settings ADD COLUMN IF NOT EXISTS can_create_appointments BOOLEAN DEFAULT false;
ALTER TABLE doctor_clinic_settings ADD COLUMN IF NOT EXISTS can_cancel_appointments BOOLEAN DEFAULT false;
```

- [ ] **Step 2: Apply migration to production**

Run:
```bash
npx supabase db push --project-ref lavfzixecvbvdqxyiwwl
```

Expected: Migration applied successfully.

- [ ] **Step 3: Regenerate TypeScript types**

Run:
```bash
npx supabase gen types typescript --project-id lavfzixecvbvdqxyiwwl > src/lib/types/database.ts
```

Expected: `database.ts` updated with new columns and enum values.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/019_add_entreturno_rendicion_permissions.sql src/lib/types/database.ts
git commit -m "feat: migration 019 — entreturno, rendicion, doctor permissions, new statuses"
```

---

## Task 2: Appointment Status Constants

**Files:**
- Create: `src/lib/constants/appointment-status.ts`

- [ ] **Step 1: Create status constants file**

This file defines colors, labels, and valid status transitions used by both API routes and UI components.

```typescript
export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  confirmed: "#3b82f6",
  arrived: "#22c55e",
  in_progress: "#15803d",
  completed: "#6b7280",
  no_show: "#ef4444",
  cancelled_patient: "#6b7280",
  cancelled_doctor: "#6b7280",
  cancelled_clinic: "#6b7280",
  rescheduled: "#6b7280",
  otorgado: "#f59e0b",
  scheduled: "#3b82f6",
}

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
  no_show: "No show",
  cancelled_patient: "Cancelled (patient)",
  cancelled_doctor: "Cancelled (doctor)",
  cancelled_clinic: "Cancelled (clinic)",
  rescheduled: "Rescheduled",
  otorgado: "Pending confirmation",
  scheduled: "Scheduled",
}

// Valid transitions: from → to[]
export const VALID_TRANSITIONS: Record<string, string[]> = {
  confirmed: ["arrived", "cancelled_patient", "cancelled_doctor", "cancelled_clinic", "rescheduled", "no_show"],
  arrived: ["in_progress", "cancelled_patient", "no_show"],
  in_progress: ["completed"],
}

export function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

// Statuses that indicate the appointment is "done" (no more actions)
export const TERMINAL_STATUSES = ["completed", "no_show", "cancelled_patient", "cancelled_doctor", "cancelled_clinic", "rescheduled"]

// Statuses that should show as faded/strikethrough in the calendar
export const FADED_STATUSES = ["completed", "no_show", "cancelled_patient", "cancelled_doctor", "cancelled_clinic", "rescheduled"]

export const CONSULTATION_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "procedure", label: "Procedure" },
  { value: "emergency", label: "Emergency" },
]

export const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants/appointment-status.ts
git commit -m "feat: add appointment status constants (colors, labels, transitions)"
```

---

## Task 3: Appointment List + Create API

**Files:**
- Create: `src/app/api/appointments/route.ts`

- [ ] **Step 1: Write GET + POST endpoints**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

const listSchema = z.object({
  clinic_id: z.string().uuid(),
  date: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  doctor_id: z.string().uuid().optional(),
  status: z.string().optional(),
  patient_id: z.string().uuid().optional(),
})

const createSchema = z.object({
  clinic_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  patient_id: z.string().uuid().optional(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  duration_minutes: z.coerce.number().int().min(5).max(120),
  reason: z.string().optional(),
  internal_notes: z.string().optional(),
  is_entreturno: z.boolean().optional().default(false),
  source: z.enum(["web", "phone", "whatsapp", "walk_in", "manual"]).optional().default("web"),
  new_patient: z.object({
    dni: z.string().min(1),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    phone: z.string().optional(),
  }).optional(),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const { clinic_id, date, start_date, end_date, doctor_id, status, patient_id } = listSchema.parse(params)

  const supabase = await createClient()

  let query = supabase
    .from("appointments")
    .select(`
      id, appointment_date, start_time, end_time, duration_minutes,
      status, reason, is_overbooking, is_entreturno, internal_notes,
      checked_in_at, started_at, completed_at,
      doctors!inner(id, first_name, last_name, specialty),
      clinic_patients!inner(id, first_name, last_name, dni, phone, insurance_provider, insurance_plan, no_show_count)
    `)
    .eq("clinic_id", clinic_id)

  // Date filters
  if (date) {
    query = query.eq("appointment_date", date)
  } else if (start_date && end_date) {
    query = query.gte("appointment_date", start_date).lte("appointment_date", end_date)
  }

  if (doctor_id) query = query.eq("doctor_id", doctor_id)
  if (status) query = query.eq("status", status)
  if (patient_id) query = query.eq("patient_id", patient_id)

  query = query.order("appointment_date").order("start_time")

  const { data, error } = await query

  if (error) throw new ApiError(error.message, 500, "DB_ERROR")

  return NextResponse.json({ data })
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validated = createSchema.parse(body)

  const supabase = await createClient()

  // Get current user's staff record for created_by
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new ApiError("Unauthorized", 401, "UNAUTHORIZED")

  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (!staff) throw new ApiError("Staff record not found", 403, "FORBIDDEN")

  // Check role permissions
  const { data: staffClinic } = await supabase
    .from("staff_clinics")
    .select("role")
    .eq("staff_id", staff.id)
    .eq("clinic_id", validated.clinic_id)
    .single()

  if (!staffClinic) throw new ApiError("Not a member of this clinic", 403, "FORBIDDEN")

  // If doctor role, check if they have permission and it's their own appointment
  if (staffClinic.role === "doctor") {
    const { data: doctorRecord } = await supabase
      .from("doctors")
      .select("id")
      .eq("staff_id", staff.id)
      .single()

    if (!doctorRecord || doctorRecord.id !== validated.doctor_id) {
      throw new ApiError("Doctors can only create appointments for themselves", 403, "FORBIDDEN")
    }

    const { data: settings } = await supabase
      .from("doctor_clinic_settings")
      .select("can_create_appointments")
      .eq("doctor_id", validated.doctor_id)
      .eq("clinic_id", validated.clinic_id)
      .single()

    if (!settings?.can_create_appointments) {
      throw new ApiError("Doctor does not have permission to create appointments", 403, "FORBIDDEN")
    }
  }

  // Handle inline patient creation
  let patientId = validated.patient_id
  if (!patientId && validated.new_patient) {
    // Check for duplicate DNI
    const { data: existing } = await supabase
      .from("clinic_patients")
      .select("id")
      .eq("clinic_id", validated.clinic_id)
      .eq("dni", validated.new_patient.dni)
      .maybeSingle()

    if (existing) {
      throw new ApiError("Patient with this DNI already exists at this clinic", 409, "DUPLICATE_DNI")
    }

    const { data: newPatient, error: patientError } = await supabase
      .from("clinic_patients")
      .insert({
        clinic_id: validated.clinic_id,
        dni: validated.new_patient.dni,
        first_name: validated.new_patient.first_name,
        last_name: validated.new_patient.last_name,
        phone: validated.new_patient.phone || null,
      })
      .select("id")
      .single()

    if (patientError) throw new ApiError(patientError.message, 500, "DB_ERROR")
    patientId = newPatient.id
  }

  if (!patientId) {
    throw new ApiError("Either patient_id or new_patient is required", 400, "MISSING_PATIENT")
  }

  // Calculate end_time from start_time + duration
  const [hours, minutes] = validated.start_time.split(":").map(Number)
  const startMinutes = hours * 60 + minutes
  const endMinutes = startMinutes + validated.duration_minutes
  const endHours = Math.floor(endMinutes / 60)
  const endMins = endMinutes % 60
  const end_time = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`

  // Insert appointment — overlap trigger will reject if conflict (unless is_overbooking)
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      clinic_id: validated.clinic_id,
      doctor_id: validated.doctor_id,
      patient_id: patientId,
      appointment_date: validated.appointment_date,
      start_time: validated.start_time,
      end_time,
      duration_minutes: validated.duration_minutes,
      status: "confirmed",
      reason: validated.reason || null,
      internal_notes: validated.internal_notes || null,
      is_overbooking: validated.is_entreturno,
      is_entreturno: validated.is_entreturno,
      source: validated.source,
      created_by: staff.id,
    })
    .select(`
      id, appointment_date, start_time, end_time, duration_minutes, status,
      doctors(id, first_name, last_name, specialty),
      clinic_patients(id, first_name, last_name, dni)
    `)
    .single()

  if (error) {
    // Check if it's an overlap error from the trigger
    if (error.message.includes("overlaps")) {
      throw new ApiError("This time slot is already taken. Use entreturno to overbbook.", 409, "SLOT_OVERLAP")
    }
    throw new ApiError(error.message, 500, "DB_ERROR")
  }

  return NextResponse.json({ data, message: "Appointment created" }, { status: 201 })
})
```

- [ ] **Step 2: Verify the build compiles**

Run:
```bash
npx next build 2>&1 | head -20
```

Expected: No TypeScript errors in the new file.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/appointments/route.ts
git commit -m "feat: add GET /api/appointments (list) + POST /api/appointments (create)"
```

---

## Task 4: Appointment Detail + Update + Status + Reschedule APIs

**Files:**
- Create: `src/app/api/appointments/[id]/route.ts`
- Create: `src/app/api/appointments/[id]/status/route.ts`
- Create: `src/app/api/appointments/[id]/reschedule/route.ts`
- Create: `src/app/api/appointments/queue/route.ts`

- [ ] **Step 1: Write appointment detail + update endpoint**

`src/app/api/appointments/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

const APPOINTMENT_SELECT = `
  id, appointment_date, start_time, end_time, duration_minutes,
  status, reason, internal_notes, is_overbooking, is_entreturno,
  source, modality, checked_in_at, started_at, completed_at,
  cancelled_at, cancellation_reason, actual_duration_minutes,
  payment_status, created_at, updated_at,
  doctors!inner(id, first_name, last_name, specialty),
  clinic_patients!inner(id, first_name, last_name, dni, phone, email,
    insurance_provider, insurance_plan, no_show_count, date_of_birth)
`

export const GET = withErrorHandler(async (request: NextRequest, context) => {
  const { id } = await context!.params
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")
  if (!clinic_id) throw new ApiError("clinic_id is required", 400, "MISSING_PARAM")

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", id)
    .eq("clinic_id", clinic_id)
    .maybeSingle()

  if (error) throw new ApiError(error.message, 500, "DB_ERROR")
  if (!data) throw new ApiError("Appointment not found", 404, "NOT_FOUND")

  return NextResponse.json({ data })
})

const updateSchema = z.object({
  clinic_id: z.string().uuid(),
  reason: z.string().nullable().optional(),
  internal_notes: z.string().nullable().optional(),
  duration_minutes: z.coerce.number().int().min(5).max(120).optional(),
})

export const PUT = withErrorHandler(async (request: NextRequest, context) => {
  const { id } = await context!.params
  const body = await request.json()
  const { clinic_id, ...updateData } = updateSchema.parse(body)

  if (Object.keys(updateData).length === 0) {
    throw new ApiError("No fields to update", 400, "NO_FIELDS")
  }

  const supabase = await createClient()

  // If duration changed, recalculate end_time
  if (updateData.duration_minutes) {
    const { data: current } = await supabase
      .from("appointments")
      .select("start_time")
      .eq("id", id)
      .eq("clinic_id", clinic_id)
      .single()

    if (current) {
      const [h, m] = current.start_time.split(":").map(Number)
      const endMin = h * 60 + m + updateData.duration_minutes
      const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`
      ;(updateData as Record<string, unknown>).end_time = endTime
    }
  }

  const { error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", id)
    .eq("clinic_id", clinic_id)

  if (error) throw new ApiError(error.message, 500, "DB_ERROR")

  const { data, error: fetchError } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("id", id)
    .eq("clinic_id", clinic_id)
    .single()

  if (fetchError) throw new ApiError(fetchError.message, 500, "DB_ERROR")

  return NextResponse.json({ data })
})
```

- [ ] **Step 2: Write status change endpoint**

`src/app/api/appointments/[id]/status/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"
import { isValidTransition } from "@/lib/constants/appointment-status"

const statusSchema = z.object({
  clinic_id: z.string().uuid(),
  status: z.string(),
  cancellation_reason: z.string().optional(),
})

export const PATCH = withErrorHandler(async (request: NextRequest, context) => {
  const { id } = await context!.params
  const body = await request.json()
  const { clinic_id, status: newStatus, cancellation_reason } = statusSchema.parse(body)

  const supabase = await createClient()

  // Get current appointment
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, status, doctor_id")
    .eq("id", id)
    .eq("clinic_id", clinic_id)
    .single()

  if (fetchError || !appointment) throw new ApiError("Appointment not found", 404, "NOT_FOUND")

  // Validate transition
  if (!isValidTransition(appointment.status, newStatus)) {
    throw new ApiError(
      `Cannot transition from '${appointment.status}' to '${newStatus}'`,
      400,
      "INVALID_TRANSITION"
    )
  }

  // Require cancellation reason for cancel statuses
  if (newStatus.startsWith("cancelled") && !cancellation_reason) {
    throw new ApiError("Cancellation reason is required", 400, "MISSING_REASON")
  }

  // Check role permissions
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new ApiError("Unauthorized", 401, "UNAUTHORIZED")

  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (!staff) throw new ApiError("Staff not found", 403, "FORBIDDEN")

  const { data: staffClinic } = await supabase
    .from("staff_clinics")
    .select("role")
    .eq("staff_id", staff.id)
    .eq("clinic_id", clinic_id)
    .single()

  if (!staffClinic) throw new ApiError("Not a member of this clinic", 403, "FORBIDDEN")

  // Role-based restrictions for doctors
  if (staffClinic.role === "doctor") {
    const { data: doctorRecord } = await supabase
      .from("doctors")
      .select("id")
      .eq("staff_id", staff.id)
      .single()

    // Doctors can only change status of their own appointments
    if (!doctorRecord || doctorRecord.id !== appointment.doctor_id) {
      throw new ApiError("Cannot modify another doctor's appointment", 403, "FORBIDDEN")
    }

    // Doctors cannot mark arrived or no_show
    if (newStatus === "arrived" || newStatus === "no_show") {
      throw new ApiError("Only admin/secretary can mark arrived or no-show", 403, "FORBIDDEN")
    }

    // For cancellation, check permission
    if (newStatus.startsWith("cancelled")) {
      const { data: settings } = await supabase
        .from("doctor_clinic_settings")
        .select("can_cancel_appointments")
        .eq("doctor_id", doctorRecord.id)
        .eq("clinic_id", clinic_id)
        .single()

      if (!settings?.can_cancel_appointments) {
        throw new ApiError("Doctor does not have permission to cancel", 403, "FORBIDDEN")
      }
    }
  }

  // Build update object with side effects
  const updateData: Record<string, unknown> = { status: newStatus }

  if (newStatus === "arrived") updateData.checked_in_at = new Date().toISOString()
  if (newStatus === "in_progress") updateData.started_at = new Date().toISOString()
  if (newStatus === "completed") {
    const now = new Date()
    updateData.completed_at = now.toISOString()
    // Calculate actual duration if started_at exists
    const { data: appt } = await supabase
      .from("appointments")
      .select("started_at")
      .eq("id", id)
      .single()
    if (appt?.started_at) {
      const started = new Date(appt.started_at)
      updateData.actual_duration_minutes = Math.round((now.getTime() - started.getTime()) / 60000)
    }
  }
  if (newStatus.startsWith("cancelled")) {
    updateData.cancelled_at = new Date().toISOString()
    updateData.cancellation_reason = cancellation_reason
  }

  const { error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", id)
    .eq("clinic_id", clinic_id)

  if (error) throw new ApiError(error.message, 500, "DB_ERROR")

  return NextResponse.json({ message: `Status changed to ${newStatus}` })
})
```

- [ ] **Step 3: Write reschedule endpoint**

`src/app/api/appointments/[id]/reschedule/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"
import { TERMINAL_STATUSES } from "@/lib/constants/appointment-status"

const rescheduleSchema = z.object({
  clinic_id: z.string().uuid(),
  new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  new_start_time: z.string().regex(/^\d{2}:\d{2}$/),
  new_duration_minutes: z.coerce.number().int().min(5).max(120).optional(),
})

export const POST = withErrorHandler(async (request: NextRequest, context) => {
  const { id } = await context!.params
  const body = await request.json()
  const { clinic_id, new_date, new_start_time, new_duration_minutes } = rescheduleSchema.parse(body)

  const supabase = await createClient()

  // Get original appointment
  const { data: original, error: fetchError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("clinic_id", clinic_id)
    .single()

  if (fetchError || !original) throw new ApiError("Appointment not found", 404, "NOT_FOUND")

  if (TERMINAL_STATUSES.includes(original.status)) {
    throw new ApiError(`Cannot reschedule a ${original.status} appointment`, 400, "INVALID_STATUS")
  }

  const duration = new_duration_minutes || original.duration_minutes
  const [h, m] = new_start_time.split(":").map(Number)
  const endMin = h * 60 + m + duration
  const end_time = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`

  // Get staff id for created_by
  const { data: { user } } = await supabase.auth.getUser()
  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single()

  // Create new appointment
  const { data: newAppt, error: createError } = await supabase
    .from("appointments")
    .insert({
      clinic_id: original.clinic_id,
      doctor_id: original.doctor_id,
      patient_id: original.patient_id,
      appointment_date: new_date,
      start_time: new_start_time,
      end_time,
      duration_minutes: duration,
      status: "confirmed",
      reason: original.reason,
      internal_notes: original.internal_notes,
      source: original.source,
      modality: original.modality,
      is_overbooking: original.is_overbooking,
      is_entreturno: original.is_entreturno,
      rescheduled_from_id: original.id,
      created_by: staff?.id,
    })
    .select("id")
    .single()

  if (createError) {
    if (createError.message.includes("overlaps")) {
      throw new ApiError("New time slot is already taken", 409, "SLOT_OVERLAP")
    }
    throw new ApiError(createError.message, 500, "DB_ERROR")
  }

  // Mark original as rescheduled
  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      status: "rescheduled",
      rescheduled_to_id: newAppt.id,
    })
    .eq("id", id)

  if (updateError) throw new ApiError(updateError.message, 500, "DB_ERROR")

  return NextResponse.json({ data: newAppt, message: "Appointment rescheduled" }, { status: 201 })
})
```

- [ ] **Step 4: Write doctor queue endpoint**

`src/app/api/appointments/queue/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

const queueSchema = z.object({
  clinic_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const { clinic_id, doctor_id } = queueSchema.parse(params)

  const supabase = await createClient()

  const today = new Date().toISOString().split("T")[0]

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id, appointment_date, start_time, end_time, duration_minutes,
      status, reason, checked_in_at, started_at, completed_at,
      clinic_patients!inner(id, first_name, last_name, dni, phone,
        insurance_provider, insurance_plan, no_show_count)
    `)
    .eq("clinic_id", clinic_id)
    .eq("doctor_id", doctor_id)
    .eq("appointment_date", today)
    .order("start_time")

  if (error) throw new ApiError(error.message, 500, "DB_ERROR")

  const in_progress = appointments?.find(a => a.status === "in_progress") || null
  const waiting = appointments?.filter(a => a.status === "arrived")
    .sort((a, b) => new Date(a.checked_in_at!).getTime() - new Date(b.checked_in_at!).getTime()) || []
  const upcoming = appointments?.filter(a => a.status === "confirmed") || []
  const completed = appointments?.filter(a => a.status === "completed").length || 0
  const no_shows = appointments?.filter(a => a.status === "no_show").length || 0

  return NextResponse.json({ in_progress, waiting, upcoming, completed, no_shows })
})
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/appointments/
git commit -m "feat: add appointment detail, status change, reschedule, and queue APIs"
```

---

## Task 5: React Query Hooks

**Files:**
- Create: `src/lib/hooks/use-appointments.ts`

- [ ] **Step 1: Write all appointment hooks**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Types
export type AppointmentListItem = {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: string
  reason: string | null
  is_overbooking: boolean
  is_entreturno: boolean
  internal_notes: string | null
  checked_in_at: string | null
  started_at: string | null
  completed_at: string | null
  doctors: {
    id: string
    first_name: string
    last_name: string
    specialty: string
  }
  clinic_patients: {
    id: string
    first_name: string
    last_name: string
    dni: string
    phone: string | null
    insurance_provider: string | null
    insurance_plan: string | null
    no_show_count: number
  }
}

export type AppointmentFilters = {
  date?: string
  start_date?: string
  end_date?: string
  doctor_id?: string
  status?: string
  patient_id?: string
}

type CreateAppointmentInput = {
  clinic_id: string
  doctor_id: string
  patient_id?: string
  appointment_date: string
  start_time: string
  duration_minutes: number
  reason?: string
  internal_notes?: string
  is_entreturno?: boolean
  source?: string
  new_patient?: {
    dni: string
    first_name: string
    last_name: string
    phone?: string
  }
}

type UpdateStatusInput = {
  clinic_id: string
  status: string
  cancellation_reason?: string
}

type RescheduleInput = {
  clinic_id: string
  new_date: string
  new_start_time: string
  new_duration_minutes?: number
}

export type QueueResponse = {
  in_progress: AppointmentListItem | null
  waiting: AppointmentListItem[]
  upcoming: AppointmentListItem[]
  completed: number
  no_shows: number
}

// Hooks

export function useAppointments(clinicId: string | null, filters: AppointmentFilters = {}) {
  return useQuery<{ data: AppointmentListItem[] }>({
    queryKey: ["appointments", clinicId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ clinic_id: clinicId! })
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })
      const res = await fetch(`/api/appointments?${params}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch appointments")
      }
      return res.json()
    },
    enabled: !!clinicId,
  })
}

export function useAppointment(appointmentId: string | null, clinicId: string | null) {
  return useQuery({
    queryKey: ["appointment", appointmentId, clinicId],
    queryFn: async () => {
      const res = await fetch(`/api/appointments/${appointmentId}?clinic_id=${clinicId}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch appointment")
      }
      return res.json()
    },
    enabled: !!appointmentId && !!clinicId,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create appointment")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["available-slots"] })
    },
  })
}

export function useUpdateAppointmentStatus(appointmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateStatusInput) => {
      const res = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update status")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] })
      queryClient.invalidateQueries({ queryKey: ["doctor-queue"] })
    },
  })
}

export function useRescheduleAppointment(appointmentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RescheduleInput) => {
      const res = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to reschedule")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["available-slots"] })
    },
  })
}

export function useDoctorQueue(clinicId: string | null, doctorId: string | null) {
  return useQuery<QueueResponse>({
    queryKey: ["doctor-queue", clinicId, doctorId],
    queryFn: async () => {
      const params = new URLSearchParams({
        clinic_id: clinicId!,
        doctor_id: doctorId!,
      })
      const res = await fetch(`/api/appointments/queue?${params}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch queue")
      }
      return res.json()
    },
    enabled: !!clinicId && !!doctorId,
    refetchInterval: 30000, // Refresh every 30s as backup to realtime
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/hooks/use-appointments.ts
git commit -m "feat: add React Query hooks for appointments (CRUD, status, reschedule, queue)"
```

---

## Task 6: Calendar Page + Components (UI Shell)

This is the biggest task. It creates all the calendar components. Due to the size, this task creates the file structure with working components, then subsequent tasks add features.

**Files:**
- Create: `src/lib/constants/appointment-status.ts` (already done in Task 2)
- Create: `src/components/calendar/calendar-header.tsx`
- Create: `src/components/calendar/calendar-sidebar.tsx`
- Create: `src/components/calendar/event-block.tsx`
- Create: `src/components/calendar/doctor-column.tsx`
- Create: `src/components/calendar/multi-doctor-grid.tsx`
- Create: `src/components/calendar/week-view.tsx`
- Create: `src/components/calendar/month-view.tsx`
- Create: `src/app/(dashboard)/calendar/page.tsx`

Due to the plan length constraints, this task shows each component's interface and key implementation. The executing agent should follow the design spec closely for the full implementation of each component.

- [ ] **Step 1: Create calendar-header.tsx**

Navigation arrows, date display, view toggle (Day/Week/Month), doctor selector (week view), "+ New appointment" button.

Props:
```typescript
type CalendarHeaderProps = {
  currentDate: Date
  view: "day" | "week" | "month"
  onDateChange: (date: Date) => void
  onViewChange: (view: "day" | "week" | "month") => void
  onNewAppointment: () => void
  selectedDoctorId?: string
  onDoctorChange?: (doctorId: string) => void
  doctors?: Array<{ id: string; first_name: string; last_name: string }>
  role: string | null
}
```

Key implementation: `‹` and `›` square buttons (30x30px, border, rounded-6px). Date format changes per view: "Friday, April 4, 2026" (day), "Mar 30 — Apr 5, 2026" (week), "April 2026" (month). "Today" pill button. View toggle with active state (blue bg). Doctor dropdown only visible in week view.

- [ ] **Step 2: Create calendar-sidebar.tsx**

Mini calendar (date picker), doctor checkboxes with color dots, status legend.

Props:
```typescript
type CalendarSidebarProps = {
  currentDate: Date
  onDateSelect: (date: Date) => void
  doctors: Array<{ id: string; first_name: string; last_name: string; color: string }>
  selectedDoctorIds: string[]
  onDoctorToggle: (doctorId: string) => void
}
```

Key: Doctor colors are assigned from a fixed palette: `["#3b82f6", "#8b5cf6", "#059669", "#d97706", "#dc2626", "#0891b2", "#7c3aed", "#db2777"]`. Max 5 selected at once.

- [ ] **Step 3: Create event-block.tsx**

Custom `eventContent` renderer for FullCalendar.

```typescript
type EventBlockProps = {
  event: {
    start: Date
    end: Date
    extendedProps: {
      patientName: string
      status: string
      reason: string | null
      isOverbooking: boolean
      duration: number
    }
  }
  compact?: boolean // true for week view (last name only)
}
```

Key: Border-left color from `APPOINTMENT_STATUS_COLORS`. Strikethrough + opacity for `FADED_STATUSES`. "OB" badge for overbooking. Compact mode shows only time + last name.

- [ ] **Step 4: Create doctor-column.tsx**

Single FullCalendar instance for one doctor.

```typescript
type DoctorColumnProps = {
  doctorId: string
  doctorName: string
  specialty: string
  color: string
  date: Date
  appointments: AppointmentListItem[]
  businessHours: { daysOfWeek: number[]; startTime: string; endTime: string }[]
  isFirst: boolean  // only first column shows time axis labels
  onSlotSelect: (info: { start: Date; end: Date; doctorId: string }) => void
  onEventClick: (appointmentId: string) => void
  onEventDrop: (appointmentId: string, newStart: Date, newEnd: Date, revert: () => void) => void
  calendarRef: React.RefObject<FullCalendarApi | null>
}
```

Key: Uses `timeGridDay` plugin. `headerToolbar={false}` (navigation handled by parent). Events transformed from `AppointmentListItem[]` to FullCalendar event format. `select` callback for new bookings. `eventClick` for detail. `eventDrop` for drag-and-drop. `nowIndicator={true}`. `slotDuration="00:15:00"`. `slotLabelInterval="00:30:00"`. Only the first column (`isFirst`) shows the time axis labels (`slotLabelContent`).

- [ ] **Step 5: Create multi-doctor-grid.tsx**

Flex container that renders multiple `DoctorColumn` components and syncs their navigation.

```typescript
type MultiDoctorGridProps = {
  date: Date
  doctors: Array<{ id: string; first_name: string; last_name: string; specialty: string; color: string }>
  appointments: AppointmentListItem[]
  schedules: Record<string, BusinessHours[]>
  onSlotSelect: (info: { start: Date; end: Date; doctorId: string }) => void
  onEventClick: (appointmentId: string) => void
  onEventDrop: (appointmentId: string, newStart: Date, newEnd: Date, revert: () => void) => void
}
```

Key: Creates one ref per doctor column. On `datesSet` from first column, calls `gotoDate()` on all others (with boolean guard to prevent infinite loops). Doctor name header above each column with color.

- [ ] **Step 6: Create week-view.tsx and month-view.tsx**

Week view: Single FullCalendar `timeGridWeek`, compact event blocks, today highlighted.

Month view: FullCalendar `dayGridMonth`, custom `dayCellContent` showing appointment count badges. On day click → calls `onDayClick(date)` which switches to day view.

- [ ] **Step 7: Create calendar page**

`src/app/(dashboard)/calendar/page.tsx`:

```typescript
"use client"

import { useState, useCallback } from "react"
import { useClinic } from "@/providers/clinic-provider"
import { useDoctors } from "@/lib/hooks/use-doctors"
import { useAppointments } from "@/lib/hooks/use-appointments"
import { CalendarHeader } from "@/components/calendar/calendar-header"
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar"
import { MultiDoctorGrid } from "@/components/calendar/multi-doctor-grid"
import { WeekView } from "@/components/calendar/week-view"
import { MonthView } from "@/components/calendar/month-view"
import { AppointmentSidePanel } from "@/components/calendar/side-panel/appointment-side-panel"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

// Fixed color palette for doctors
const DOCTOR_COLORS = ["#3b82f6", "#8b5cf6", "#059669", "#d97706", "#dc2626", "#0891b2", "#7c3aed", "#db2777"]

export default function CalendarPage() {
  const { activeClinicId, activeRole } = useClinic()

  // View state
  const [view, setView] = useState<"day" | "week" | "month">("day")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([])
  const [weekViewDoctorId, setWeekViewDoctorId] = useState<string>("")

  // Side panel state
  const [panelMode, setPanelMode] = useState<"closed" | "new" | "detail">("closed")
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [slotInfo, setSlotInfo] = useState<{ start: Date; end: Date; doctorId: string } | null>(null)

  // Data
  const { data: doctorsData } = useDoctors(activeClinicId)
  const doctors = (doctorsData?.data ?? []).map((d, i) => ({
    ...d,
    color: DOCTOR_COLORS[i % DOCTOR_COLORS.length],
  }))

  // Auto-select first 3 doctors
  // (useEffect to initialize selectedDoctorIds when doctors load)

  // Build date filters based on view
  const filters = view === "day"
    ? { date: format(currentDate, "yyyy-MM-dd") }
    : view === "week"
    ? { start_date: format(startOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        end_date: format(endOfWeek(currentDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        doctor_id: weekViewDoctorId || undefined }
    : { start_date: format(startOfMonth(currentDate), "yyyy-MM-dd"),
        end_date: format(endOfMonth(currentDate), "yyyy-MM-dd") }

  const { data: appointmentsData } = useAppointments(activeClinicId, filters)
  const appointments = appointmentsData?.data ?? []

  // Handlers
  const handleSlotSelect = useCallback((info: { start: Date; end: Date; doctorId: string }) => {
    setSlotInfo(info)
    setPanelMode("new")
  }, [])

  const handleEventClick = useCallback((appointmentId: string) => {
    setSelectedAppointmentId(appointmentId)
    setPanelMode("detail")
  }, [])

  const handleClosePanel = useCallback(() => {
    setPanelMode("closed")
    setSelectedAppointmentId(null)
    setSlotInfo(null)
  }, [])

  // Keyboard shortcuts
  // useEffect for Esc (close panel) and Ctrl+N (new appointment)

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar — only in day view */}
      {view === "day" && (
        <CalendarSidebar
          currentDate={currentDate}
          onDateSelect={setCurrentDate}
          doctors={doctors}
          selectedDoctorIds={selectedDoctorIds}
          onDoctorToggle={(id) => {
            setSelectedDoctorIds(prev =>
              prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id].slice(0, 5)
            )
          }}
        />
      )}

      {/* Main calendar area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onDateChange={setCurrentDate}
          onViewChange={setView}
          onNewAppointment={() => setPanelMode("new")}
          selectedDoctorId={weekViewDoctorId}
          onDoctorChange={setWeekViewDoctorId}
          doctors={doctors}
          role={activeRole}
        />

        <div className="flex-1 overflow-hidden">
          {view === "day" && (
            <MultiDoctorGrid
              date={currentDate}
              doctors={doctors.filter(d => selectedDoctorIds.includes(d.id))}
              appointments={appointments}
              schedules={{}}
              onSlotSelect={handleSlotSelect}
              onEventClick={handleEventClick}
              onEventDrop={() => {}} // Task 8
            />
          )}
          {view === "week" && (
            <WeekView
              date={currentDate}
              appointments={appointments}
              onEventClick={handleEventClick}
              onSlotSelect={handleSlotSelect}
            />
          )}
          {view === "month" && (
            <MonthView
              date={currentDate}
              appointments={appointments}
              onDayClick={(date) => { setCurrentDate(date); setView("day") }}
            />
          )}
        </div>
      </div>

      {/* Side Panel */}
      {panelMode !== "closed" && (
        <AppointmentSidePanel
          mode={panelMode}
          appointmentId={selectedAppointmentId}
          slotInfo={slotInfo}
          clinicId={activeClinicId}
          role={activeRole}
          onClose={handleClosePanel}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/calendar/ src/app/(dashboard)/calendar/
git commit -m "feat: add calendar page with multi-doctor day view, week view, month view"
```

---

## Task 7: Side Panel — Booking Form + Appointment Detail

**Files:**
- Create: `src/components/calendar/side-panel/appointment-side-panel.tsx`
- Create: `src/components/calendar/side-panel/booking-form.tsx`
- Create: `src/components/calendar/side-panel/appointment-detail.tsx`
- Create: `src/components/calendar/side-panel/patient-search.tsx`
- Create: `src/components/calendar/side-panel/inline-patient-form.tsx`

- [ ] **Step 1: Create patient-search.tsx**

Autocomplete component. Debounced search (300ms) against `/api/patients?search=...`. Shows name, DNI, insurance, no-show count. "+ New patient" at bottom.

- [ ] **Step 2: Create inline-patient-form.tsx**

Inline form for new patient: DNI (required), first name (required), last name (required), phone (optional). Collapsible "More details" with insurance and date of birth. Uses react-hook-form + zod.

- [ ] **Step 3: Create booking-form.tsx**

Pre-fills doctor + date + time from slot click. Patient search at top. After patient selected, shows consultation type, duration, time, notes. "Book appointment" button calls `useCreateAppointment`. Handles loading/error states with toast (sonner).

- [ ] **Step 4: Create appointment-detail.tsx**

Shows patient info card, appointment info, contextual action buttons (only valid transitions). Calls `useUpdateAppointmentStatus`. "Reschedule" and "Cancel" secondary buttons. Cancel requires confirmation dialog with reason input.

- [ ] **Step 5: Create appointment-side-panel.tsx**

Container: 360px wide, slides from right with transition. Renders `BookingForm` or `AppointmentDetail` based on `mode` prop. Close button in header.

- [ ] **Step 6: Commit**

```bash
git add src/components/calendar/side-panel/
git commit -m "feat: add side panel with booking form, appointment detail, patient search"
```

---

## Task 8: Drag-and-Drop Rescheduling

**Files:**
- Modify: `src/components/calendar/doctor-column.tsx`
- Modify: `src/app/(dashboard)/calendar/page.tsx`

- [ ] **Step 1: Add eventDrop handler to doctor-column.tsx**

FullCalendar `eventDrop` callback fires when a block is dragged. Shows confirmation dialog using shadcn AlertDialog. On confirm, calls `useRescheduleAppointment`. On cancel, calls `info.revert()`.

- [ ] **Step 2: Wire up drag-and-drop in calendar page**

The `onEventDrop` callback in `CalendarPage` receives `appointmentId`, `newStart`, `newEnd`, and `revert`. Opens a confirmation dialog, then calls the reschedule mutation.

- [ ] **Step 3: Commit**

```bash
git add src/components/calendar/doctor-column.tsx src/app/(dashboard)/calendar/page.tsx
git commit -m "feat: add drag-and-drop appointment rescheduling with confirmation"
```

---

## Task 9: Doctor's View (Queue)

**Files:**
- Create: `src/components/calendar/doctor-view/doctor-queue.tsx`
- Modify: `src/app/(dashboard)/calendar/page.tsx`

- [ ] **Step 1: Create doctor-queue.tsx**

Three sections: In progress (green), Waiting (yellow, ordered by checked_in_at, shows wait time), Upcoming (gray). "Start consultation" and "Complete consultation" buttons call `useUpdateAppointmentStatus`. Footer with completed/remaining/no-show counts.

- [ ] **Step 2: Integrate into calendar page**

When `activeRole === "doctor"`, render single column calendar + doctor queue panel (instead of multi-doctor grid + side panel). Use `useDoctorQueue` hook.

- [ ] **Step 3: Commit**

```bash
git add src/components/calendar/doctor-view/ src/app/(dashboard)/calendar/page.tsx
git commit -m "feat: add doctor's patient queue (waiting room) view"
```

---

## Task 10: Supabase Realtime

**Files:**
- Modify: `src/app/(dashboard)/calendar/page.tsx`

- [ ] **Step 1: Add realtime subscription**

In the calendar page, set up a Supabase Realtime subscription on the `appointments` table filtered by `clinic_id`. On any change (INSERT, UPDATE, DELETE), invalidate the React Query appointments cache.

```typescript
import { createClient } from "@/lib/supabase/client"

useEffect(() => {
  if (!activeClinicId) return

  const supabase = createClient()
  const channel = supabase
    .channel(`appointments-${activeClinicId}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "appointments",
      filter: `clinic_id=eq.${activeClinicId}`,
    }, () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["doctor-queue"] })
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [activeClinicId, queryClient])
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(dashboard)/calendar/page.tsx
git commit -m "feat: add Supabase Realtime subscription for live calendar updates"
```

---

## Task 11: Doctor Permission Toggle in Settings

**Files:**
- Modify: `src/components/doctors/clinic-settings-form.tsx` (or the settings form in the doctor detail page)

- [ ] **Step 1: Add permission checkboxes**

Add two checkboxes to the doctor clinic settings form (admin only): "Can create appointments" and "Can cancel/reschedule appointments". These toggle `can_create_appointments` and `can_cancel_appointments` columns.

- [ ] **Step 2: Update the doctor settings API to handle new fields**

Modify `src/app/api/doctors/[id]/settings/route.ts` PUT handler to accept and save the new boolean fields.

- [ ] **Step 3: Commit**

```bash
git add src/components/doctors/ src/app/api/doctors/
git commit -m "feat: add doctor appointment permission toggles (admin only)"
```

---

## Task 12: Update Plan + Final Verification

**Files:**
- Modify: `docs/plan.md`

- [ ] **Step 1: Update plan.md**

Mark all Week 4 items as completed. Update the plan with any notes from implementation.

- [ ] **Step 2: Verify the build**

Run:
```bash
npx next build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit and push**

```bash
git add docs/plan.md
git commit -m "docs: mark Week 4 (Appointments + FullCalendar) as complete in plan"
git push
```
