# Doctor Section + Schedule Configuration + Available Slots — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete `/doctors` section with doctor listing, profile/settings editing, weekly schedule management, schedule overrides, and available slots preview — wiring the existing `get_available_slots` DB function to an API route.

**Architecture:** Doctors are global entities (they authenticate via `staff`). Per-clinic data lives in `doctor_clinic_settings` (junction table). Schedules (`doctor_schedules`) and overrides (`schedule_overrides`) are per-doctor-per-clinic. The detail page (`/doctors/[id]`) has 5 sections: Profile, Clinic Settings, Weekly Schedule, Overrides, and Slots Preview. All API routes follow the existing pattern: zod validation → Supabase query → JSON response.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase (PostgreSQL + RLS), React Query (TanStack Query), react-hook-form + zod, shadcn/ui + Tailwind CSS, lucide-react icons, date-fns

**Spec:** `docs/superpowers/specs/2026-03-29-doctor-schedules-available-slots-design.md`

---

## File Structure

```
NEW FILES:
  src/app/api/doctors/route.ts                              # GET list doctors at clinic
  src/app/api/doctors/[id]/route.ts                         # GET detail, PUT profile
  src/app/api/doctors/[id]/settings/route.ts                # PUT clinic settings
  src/app/api/doctors/[id]/schedules/route.ts               # GET list, POST create
  src/app/api/doctors/[id]/schedules/[scheduleId]/route.ts  # PUT update, DELETE remove
  src/app/api/doctors/[id]/overrides/route.ts               # GET list, POST create
  src/app/api/doctors/[id]/overrides/[overrideId]/route.ts  # DELETE remove
  src/app/api/doctors/[id]/available-slots/route.ts         # GET slots for date
  src/app/(dashboard)/doctors/page.tsx                      # Doctor list page
  src/app/(dashboard)/doctors/[id]/page.tsx                 # Doctor detail page (all 5 sections)
  src/lib/hooks/use-doctors.ts                              # All React Query hooks
  src/components/doctors/doctor-table.tsx                    # Table for list page
  src/components/doctors/doctor-profile-form.tsx             # Profile section form
  src/components/doctors/clinic-settings-form.tsx            # Clinic settings section form
  src/components/doctors/schedule-editor.tsx                 # Weekly schedule editor
  src/components/doctors/override-manager.tsx                # Override list + add form
  src/components/doctors/slots-preview.tsx                   # Date picker + slot chips

MODIFIED FILES:
  (none — sidebar already has the Doctors link)
```

---

## Task 1: Database Migration — Add Booking Window Columns

**Files:**
- Create: `supabase/migrations/016_add_booking_window.sql` (applied via MCP, not local file)

This migration adds two columns to the `clinics` table that control how far ahead appointments can be booked. These prevent bots or users from accidentally booking years in the future.

- [ ] **Step 1: Apply the migration via Supabase MCP**

```sql
-- 016_add_booking_window.sql
-- Adds booking window limits to clinics table.
-- max_booking_days_ahead: how many days into the future appointments can be booked (default 60)
-- min_booking_hours_ahead: minimum hours before a slot time that booking is allowed (default 2)

ALTER TABLE clinics
  ADD COLUMN max_booking_days_ahead INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN min_booking_hours_ahead INTEGER NOT NULL DEFAULT 2;

COMMENT ON COLUMN clinics.max_booking_days_ahead IS 'Maximum days in the future an appointment can be booked. Default 60.';
COMMENT ON COLUMN clinics.min_booking_hours_ahead IS 'Minimum hours before appointment time that booking is allowed. Default 2.';
```

- [ ] **Step 2: Regenerate TypeScript types**

Run: `npx supabase gen types typescript --project-id lavfzixecvbvdqxyiwwl > src/lib/types/database.ts`

Verify: The `clinics` Row type now includes `max_booking_days_ahead: number` and `min_booking_hours_ahead: number`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types/database.ts
git commit -m "feat: add booking window columns to clinics table (migration 016)"
```

---

## Task 2: API Route — List Doctors

**Files:**
- Create: `src/app/api/doctors/route.ts`

This endpoint lists all doctors that work at a given clinic. It joins `doctors` → `staff` (for name/email) → `doctor_clinic_settings` (for per-clinic status and fee).

- [ ] **Step 1: Create the API route**

```typescript
/**
 * API Route: /api/doctors
 *
 * GET /api/doctors?clinic_id=xxx
 *   → Returns list of doctors at the clinic
 *   → Joins: doctors → staff (name, email) → doctor_clinic_settings (per-clinic config)
 *
 * No POST — doctors are created via the create-user.ts CLI script
 * because they need Supabase Auth accounts.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const listSchema = z.object({
  clinic_id: z.string().uuid(),
})

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = listSchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { clinic_id } = parsed.data
  const supabase = await createClient()

  // Query doctor_clinic_settings (filtered by clinic_id via RLS),
  // then join to doctors and staff to get name/email/specialty.
  const { data, error } = await supabase
    .from("doctor_clinic_settings")
    .select(`
      id,
      doctor_id,
      default_slot_duration_minutes,
      consultation_fee,
      is_active,
      allows_overbooking,
      max_daily_appointments,
      doctors!inner (
        id,
        specialty,
        license_number,
        staff_id,
        staff!inner (
          id,
          first_name,
          last_name,
          email
        )
      )
    `)
    .eq("clinic_id", clinic_id)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Flatten the nested response into a clean shape for the frontend
  const doctors = (data ?? []).map((dcs) => {
    const doctor = dcs.doctors as unknown as {
      id: string
      specialty: string | null
      license_number: string | null
      staff_id: string
      staff: { id: string; first_name: string; last_name: string; email: string }
    }
    return {
      id: doctor.id,
      staff_id: doctor.staff_id,
      full_name: `${doctor.staff.last_name}, ${doctor.staff.first_name}`,
      email: doctor.staff.email,
      specialty: doctor.specialty,
      license_number: doctor.license_number,
      is_active: dcs.is_active,
      consultation_fee: dcs.consultation_fee,
      default_slot_duration_minutes: dcs.default_slot_duration_minutes,
    }
  })

  return NextResponse.json({ data: doctors })
}
```

- [ ] **Step 2: Verify by running the dev server**

Run: `npx next build` (or just check for TypeScript errors with `npx tsc --noEmit`)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/doctors/route.ts
git commit -m "feat: add GET /api/doctors endpoint (list doctors at clinic)"
```

---

## Task 3: API Route — Doctor Detail + Update Profile

**Files:**
- Create: `src/app/api/doctors/[id]/route.ts`

GET returns doctor profile + all clinic settings. PUT updates the global doctor fields (specialty, license_number) and the staff name. Only admin or the doctor themselves can update.

- [ ] **Step 1: Create the API route**

```typescript
/**
 * API Route: /api/doctors/[id]
 *
 * GET /api/doctors/[id]?clinic_id=xxx
 *   → Returns doctor profile (from staff + doctors) + clinic settings
 *
 * PUT /api/doctors/[id]
 *   → Updates doctor profile: specialty, license_number (on doctors table)
 *   → Updates name: first_name, last_name (on staff table)
 *   → Auth: admin or the doctor themselves
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const updateSchema = z.object({
  clinic_id: z.string().uuid(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  specialty: z.string().nullable().optional(),
  license_number: z.string().nullable().optional(),
})

// ─── GET: Fetch doctor detail ──────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")

  if (!clinic_id) {
    return NextResponse.json(
      { error: "clinic_id query parameter is required" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // 1. Fetch the doctor with staff info
  const { data: doctor, error: doctorError } = await supabase
    .from("doctors")
    .select(`
      id,
      specialty,
      license_number,
      staff_id,
      staff!inner (
        id,
        first_name,
        last_name,
        email
      )
    `)
    .eq("id", id)
    .single()

  if (doctorError || !doctor) {
    return NextResponse.json(
      { error: "Doctor not found" },
      { status: 404 }
    )
  }

  // 2. Fetch clinic settings for this doctor at this clinic
  const { data: settings, error: settingsError } = await supabase
    .from("doctor_clinic_settings")
    .select("*")
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)
    .maybeSingle()

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 })
  }

  // 3. Flatten response
  const staff = doctor.staff as unknown as {
    id: string; first_name: string; last_name: string; email: string
  }

  return NextResponse.json({
    data: {
      id: doctor.id,
      staff_id: doctor.staff_id,
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email,
      specialty: doctor.specialty,
      license_number: doctor.license_number,
      // Clinic settings (may be null if not configured at this clinic)
      clinic_settings: settings ? {
        id: settings.id,
        default_slot_duration_minutes: settings.default_slot_duration_minutes,
        max_daily_appointments: settings.max_daily_appointments,
        consultation_fee: settings.consultation_fee,
        allows_overbooking: settings.allows_overbooking,
        max_overbooking_slots: settings.max_overbooking_slots,
        is_active: settings.is_active,
      } : null,
    },
  })
}

// ─── PUT: Update doctor profile ────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { clinic_id, first_name, last_name, specialty, license_number } = parsed.data
  const supabase = await createClient()

  // 1. Check the doctor exists and get staff_id
  const { data: doctor, error: fetchError } = await supabase
    .from("doctors")
    .select("id, staff_id")
    .eq("id", id)
    .single()

  if (fetchError || !doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
  }

  // 2. Update doctors table (specialty, license_number)
  const doctorUpdate: Record<string, unknown> = {}
  if (specialty !== undefined) doctorUpdate.specialty = specialty
  if (license_number !== undefined) doctorUpdate.license_number = license_number

  if (Object.keys(doctorUpdate).length > 0) {
    const { error } = await supabase
      .from("doctors")
      .update(doctorUpdate)
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // 3. Update staff table (first_name, last_name)
  const staffUpdate: Record<string, unknown> = {}
  if (first_name !== undefined) staffUpdate.first_name = first_name
  if (last_name !== undefined) staffUpdate.last_name = last_name

  if (Object.keys(staffUpdate).length > 0) {
    const { error } = await supabase
      .from("staff")
      .update(staffUpdate)
      .eq("id", doctor.staff_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // 4. Re-fetch and return updated data (reuse GET logic pattern)
  const { data: updated, error: refetchError } = await supabase
    .from("doctors")
    .select(`
      id, specialty, license_number, staff_id,
      staff!inner ( id, first_name, last_name, email )
    `)
    .eq("id", id)
    .single()

  if (refetchError || !updated) {
    return NextResponse.json({ error: "Failed to fetch updated data" }, { status: 500 })
  }

  const updatedStaff = updated.staff as unknown as {
    id: string; first_name: string; last_name: string; email: string
  }

  return NextResponse.json({
    data: {
      id: updated.id,
      staff_id: updated.staff_id,
      first_name: updatedStaff.first_name,
      last_name: updatedStaff.last_name,
      email: updatedStaff.email,
      specialty: updated.specialty,
      license_number: updated.license_number,
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/doctors/[id]/route.ts
git commit -m "feat: add GET/PUT /api/doctors/[id] (doctor detail + profile update)"
```

---

## Task 4: API Route — Update Clinic Settings

**Files:**
- Create: `src/app/api/doctors/[id]/settings/route.ts`

PUT updates `doctor_clinic_settings` for a doctor at a specific clinic. Admin only.

- [ ] **Step 1: Create the API route**

```typescript
/**
 * API Route: /api/doctors/[id]/settings
 *
 * PUT /api/doctors/[id]/settings
 *   → Updates doctor_clinic_settings (fee, slot duration, overbooking, etc.)
 *   → Auth: admin only
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const updateSettingsSchema = z.object({
  clinic_id: z.string().uuid(),
  default_slot_duration_minutes: z.number().int().min(5).max(120).optional(),
  max_daily_appointments: z.number().int().min(1).nullable().optional(),
  consultation_fee: z.number().min(0).nullable().optional(),
  allows_overbooking: z.boolean().optional(),
  max_overbooking_slots: z.number().int().min(1).nullable().optional(),
  is_active: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await params
  const body = await request.json()
  const parsed = updateSettingsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { clinic_id, ...updateData } = parsed.data

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("doctor_clinic_settings")
    .update(updateData)
    .eq("doctor_id", doctorId)
    .eq("clinic_id", clinic_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/doctors/[id]/settings/route.ts
git commit -m "feat: add PUT /api/doctors/[id]/settings (clinic settings update)"
```

---

## Task 5: API Routes — Schedules CRUD

**Files:**
- Create: `src/app/api/doctors/[id]/schedules/route.ts`
- Create: `src/app/api/doctors/[id]/schedules/[scheduleId]/route.ts`

- [ ] **Step 1: Create the list + create route**

```typescript
/**
 * API Route: /api/doctors/[id]/schedules
 *
 * GET /api/doctors/[id]/schedules?clinic_id=xxx
 *   → Returns all schedule blocks for this doctor at this clinic
 *
 * POST /api/doctors/[id]/schedules
 *   → Creates a new schedule block
 *   → Validates: end > start, no overlapping blocks for same day
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const createScheduleSchema = z.object({
  clinic_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  slot_duration_minutes: z.number().int().min(5).max(120).optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await params
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")

  if (!clinic_id) {
    return NextResponse.json(
      { error: "clinic_id query parameter is required" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("clinic_id", clinic_id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await params
  const body = await request.json()
  const parsed = createScheduleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { clinic_id, day_of_week, start_time, end_time, slot_duration_minutes, valid_from, valid_until } = parsed.data

  // Validate end_time > start_time
  if (end_time <= start_time) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // If no slot_duration_minutes provided, fetch default from doctor_clinic_settings
  let duration = slot_duration_minutes
  if (!duration) {
    const { data: settings } = await supabase
      .from("doctor_clinic_settings")
      .select("default_slot_duration_minutes")
      .eq("doctor_id", doctorId)
      .eq("clinic_id", clinic_id)
      .single()

    duration = settings?.default_slot_duration_minutes ?? 30
  }

  // Check for overlapping schedule blocks on the same day
  const { data: existing } = await supabase
    .from("doctor_schedules")
    .select("id, start_time, end_time")
    .eq("doctor_id", doctorId)
    .eq("clinic_id", clinic_id)
    .eq("day_of_week", day_of_week)
    .eq("is_active", true)

  const hasOverlap = (existing ?? []).some((block) => {
    return start_time < block.end_time && end_time > block.start_time
  })

  if (hasOverlap) {
    return NextResponse.json(
      { error: "This time block overlaps with an existing schedule block on the same day" },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from("doctor_schedules")
    .insert({
      doctor_id: doctorId,
      clinic_id,
      day_of_week,
      start_time,
      end_time,
      slot_duration_minutes: duration,
      valid_from: valid_from ?? new Date().toISOString().split("T")[0],
      valid_until: valid_until ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
```

- [ ] **Step 2: Create the update + delete route**

```typescript
/**
 * API Route: /api/doctors/[id]/schedules/[scheduleId]
 *
 * PUT    → Update a schedule block (start_time, end_time, slot_duration, is_active)
 * DELETE → Remove a schedule block
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const updateScheduleSchema = z.object({
  clinic_id: z.string().uuid(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  slot_duration_minutes: z.number().int().min(5).max(120).optional(),
  is_active: z.boolean().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().nullable().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { id: doctorId, scheduleId } = await params
  const body = await request.json()
  const parsed = updateScheduleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { clinic_id, ...updateData } = parsed.data

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  // Validate end > start if both provided
  if (updateData.start_time && updateData.end_time && updateData.end_time <= updateData.start_time) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("doctor_schedules")
    .update(updateData)
    .eq("id", scheduleId)
    .eq("doctor_id", doctorId)
    .eq("clinic_id", clinic_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { id: doctorId, scheduleId } = await params
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")

  if (!clinic_id) {
    return NextResponse.json(
      { error: "clinic_id query parameter is required" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("doctor_schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("doctor_id", doctorId)
    .eq("clinic_id", clinic_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/doctors/[id]/schedules/route.ts src/app/api/doctors/[id]/schedules/[scheduleId]/route.ts
git commit -m "feat: add schedules CRUD endpoints (GET/POST/PUT/DELETE)"
```

---

## Task 6: API Routes — Overrides CRUD

**Files:**
- Create: `src/app/api/doctors/[id]/overrides/route.ts`
- Create: `src/app/api/doctors/[id]/overrides/[overrideId]/route.ts`

- [ ] **Step 1: Create the list + create route**

```typescript
/**
 * API Route: /api/doctors/[id]/overrides
 *
 * GET /api/doctors/[id]/overrides?clinic_id=xxx
 *   → Returns upcoming overrides (today and future only)
 *
 * POST /api/doctors/[id]/overrides
 *   → Creates a new override (block or available)
 *   → Validates: date within booking window, end > start
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const createOverrideSchema = z.object({
  clinic_id: z.string().uuid(),
  override_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  override_type: z.enum(["block", "available"]),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  reason: z.string().nullable().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await params
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")

  if (!clinic_id) {
    return NextResponse.json(
      { error: "clinic_id query parameter is required" },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("schedule_overrides")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("clinic_id", clinic_id)
    .gte("override_date", today)
    .order("override_date", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await params
  const body = await request.json()
  const parsed = createOverrideSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { clinic_id, override_date, override_type, start_time, end_time, reason } = parsed.data

  // Validate: date must be today or future
  const today = new Date().toISOString().split("T")[0]
  if (override_date < today) {
    return NextResponse.json(
      { error: "Override date must be today or in the future" },
      { status: 400 }
    )
  }

  // Validate: if both times provided, end > start
  if (start_time && end_time && end_time <= start_time) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Validate: date within booking window
  const { data: clinic } = await supabase
    .from("clinics")
    .select("max_booking_days_ahead")
    .eq("id", clinic_id)
    .single()

  if (clinic) {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + clinic.max_booking_days_ahead)
    const maxDateStr = maxDate.toISOString().split("T")[0]

    if (override_date > maxDateStr) {
      return NextResponse.json(
        { error: `Override date must be within ${clinic.max_booking_days_ahead} days from today` },
        { status: 400 }
      )
    }
  }

  const { data, error } = await supabase
    .from("schedule_overrides")
    .insert({
      doctor_id: doctorId,
      clinic_id,
      override_date,
      override_type,
      start_time: start_time ?? null,
      end_time: end_time ?? null,
      reason: reason ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
```

- [ ] **Step 2: Create the delete route**

```typescript
/**
 * API Route: /api/doctors/[id]/overrides/[overrideId]
 *
 * DELETE → Remove an override
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; overrideId: string }> }
) {
  const { id: doctorId, overrideId } = await params
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")

  if (!clinic_id) {
    return NextResponse.json(
      { error: "clinic_id query parameter is required" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("schedule_overrides")
    .delete()
    .eq("id", overrideId)
    .eq("doctor_id", doctorId)
    .eq("clinic_id", clinic_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/doctors/[id]/overrides/route.ts src/app/api/doctors/[id]/overrides/[overrideId]/route.ts
git commit -m "feat: add overrides CRUD endpoints (GET/POST/DELETE)"
```

---

## Task 7: API Route — Available Slots

**Files:**
- Create: `src/app/api/doctors/[id]/available-slots/route.ts`

Calls the existing `get_available_slots` Supabase RPC function with booking window validation.

- [ ] **Step 1: Create the API route**

```typescript
/**
 * API Route: /api/doctors/[id]/available-slots
 *
 * GET /api/doctors/[id]/available-slots?clinic_id=xxx&date=YYYY-MM-DD
 *   → Calls the get_available_slots() Supabase RPC function
 *   → Validates date is within the clinic's booking window
 *   → Returns array of time slots with availability status
 *
 * Note: min_booking_hours_ahead is NOT enforced here.
 * That applies per-slot at booking time (Week 3), since it
 * depends on the slot's actual datetime, not just the date.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const querySchema = z.object({
  clinic_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await params
  const rawParams = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = querySchema.safeParse(rawParams)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { clinic_id, date } = parsed.data
  const supabase = await createClient()

  // 1. Validate date is within booking window
  const { data: clinic } = await supabase
    .from("clinics")
    .select("max_booking_days_ahead")
    .eq("id", clinic_id)
    .single()

  if (clinic) {
    const today = new Date()
    const requestedDate = new Date(date + "T00:00:00")
    const todayStr = today.toISOString().split("T")[0]

    // Can't check past dates
    if (date < todayStr) {
      return NextResponse.json(
        { error: "Cannot check availability for past dates" },
        { status: 400 }
      )
    }

    // Can't check beyond booking window
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + clinic.max_booking_days_ahead)
    if (requestedDate > maxDate) {
      return NextResponse.json(
        { error: `Date must be within ${clinic.max_booking_days_ahead} days from today` },
        { status: 400 }
      )
    }
  }

  // 2. Call the get_available_slots RPC function
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_doctor_id: doctorId,
    p_date: date,
    p_clinic_id: clinic_id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/doctors/[id]/available-slots/route.ts
git commit -m "feat: add GET /api/doctors/[id]/available-slots (wires get_available_slots RPC)"
```

---

## Task 8: React Query Hooks

**Files:**
- Create: `src/lib/hooks/use-doctors.ts`

All 12 hooks for doctors, schedules, overrides, and available slots.

- [ ] **Step 1: Create the hooks file**

```typescript
/**
 * React Query hooks for doctor data.
 *
 * These hooks are the bridge between the API routes and the UI.
 * Same pattern as use-patients.ts:
 * - useQuery for fetching (cached, auto-refetch on key change)
 * - useMutation for creating/updating/deleting (invalidates cache on success)
 *
 * Hooks are organized by resource:
 * 1. Doctors (list, detail, update profile, update settings)
 * 2. Schedules (list, create, update, delete)
 * 3. Overrides (list, create, delete)
 * 4. Available Slots (fetch for a date)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ─── Types ───────────────────────────────────────────────────────

/** A doctor row as returned by the list endpoint */
export type DoctorListItem = {
  id: string
  staff_id: string
  full_name: string
  email: string
  specialty: string | null
  license_number: string | null
  is_active: boolean | null
  consultation_fee: number | null
  default_slot_duration_minutes: number
}

/** Full doctor detail as returned by the detail endpoint */
export type DoctorDetail = {
  id: string
  staff_id: string
  first_name: string
  last_name: string
  email: string
  specialty: string | null
  license_number: string | null
  clinic_settings: {
    id: string
    default_slot_duration_minutes: number
    max_daily_appointments: number | null
    consultation_fee: number | null
    allows_overbooking: boolean | null
    max_overbooking_slots: number | null
    is_active: boolean | null
  } | null
}

/** A schedule block row */
export type ScheduleBlock = {
  id: string
  doctor_id: string
  clinic_id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  is_active: boolean | null
  valid_from: string | null
  valid_until: string | null
}

/** An override row */
export type ScheduleOverride = {
  id: string
  doctor_id: string
  clinic_id: string
  override_date: string
  override_type: "block" | "available"
  start_time: string | null
  end_time: string | null
  reason: string | null
}

/** A time slot from get_available_slots */
export type TimeSlot = {
  slot_start: string
  slot_end: string
  is_available: boolean
  existing_appointment_id: string | null
}

// ─── Input types ─────────────────────────────────────────────────

type UpdateDoctorInput = {
  clinic_id: string
  first_name?: string
  last_name?: string
  specialty?: string | null
  license_number?: string | null
}

type UpdateSettingsInput = {
  clinic_id: string
  default_slot_duration_minutes?: number
  max_daily_appointments?: number | null
  consultation_fee?: number | null
  allows_overbooking?: boolean
  max_overbooking_slots?: number | null
  is_active?: boolean
}

type CreateScheduleInput = {
  clinic_id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes?: number
  valid_from?: string
  valid_until?: string | null
}

type UpdateScheduleInput = {
  clinic_id: string
  start_time?: string
  end_time?: string
  slot_duration_minutes?: number
  is_active?: boolean
  valid_from?: string
  valid_until?: string | null
}

type CreateOverrideInput = {
  clinic_id: string
  override_date: string
  override_type: "block" | "available"
  start_time?: string | null
  end_time?: string | null
  reason?: string | null
}

// ─── Doctor Hooks ────────────────────────────────────────────────

/** Fetch list of doctors at a clinic */
export function useDoctors(clinicId: string | null) {
  return useQuery<{ data: DoctorListItem[] }>({
    queryKey: ["doctors", clinicId],
    queryFn: async () => {
      const res = await fetch(`/api/doctors?clinic_id=${clinicId}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch doctors")
      }
      return res.json()
    },
    enabled: !!clinicId,
  })
}

/** Fetch a single doctor's full details + clinic settings */
export function useDoctor(doctorId: string | null, clinicId: string | null) {
  return useQuery<{ data: DoctorDetail }>({
    queryKey: ["doctor", doctorId, clinicId],
    queryFn: async () => {
      const res = await fetch(`/api/doctors/${doctorId}?clinic_id=${clinicId}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch doctor")
      }
      return res.json()
    },
    enabled: !!doctorId && !!clinicId,
  })
}

/** Mutation: update doctor profile (name, specialty, license) */
export function useUpdateDoctor(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateDoctorInput) => {
      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update doctor")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] })
      queryClient.invalidateQueries({ queryKey: ["doctor", doctorId] })
    },
  })
}

/** Mutation: update doctor clinic settings (fee, slots, overbooking) */
export function useUpdateDoctorSettings(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      const res = await fetch(`/api/doctors/${doctorId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update settings")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] })
      queryClient.invalidateQueries({ queryKey: ["doctor", doctorId] })
    },
  })
}

// ─── Schedule Hooks ──────────────────────────────────────────────

/** Fetch all schedule blocks for a doctor at a clinic */
export function useDoctorSchedules(doctorId: string | null, clinicId: string | null) {
  return useQuery<{ data: ScheduleBlock[] }>({
    queryKey: ["doctor-schedules", doctorId, clinicId],
    queryFn: async () => {
      const res = await fetch(
        `/api/doctors/${doctorId}/schedules?clinic_id=${clinicId}`
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch schedules")
      }
      return res.json()
    },
    enabled: !!doctorId && !!clinicId,
  })
}

/** Mutation: create a new schedule block */
export function useCreateSchedule(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateScheduleInput) => {
      const res = await fetch(`/api/doctors/${doctorId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create schedule")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-schedules", doctorId] })
    },
  })
}

/** Mutation: update a schedule block */
export function useUpdateSchedule(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ scheduleId, ...input }: UpdateScheduleInput & { scheduleId: string }) => {
      const res = await fetch(`/api/doctors/${doctorId}/schedules/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update schedule")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-schedules", doctorId] })
    },
  })
}

/** Mutation: delete a schedule block */
export function useDeleteSchedule(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ scheduleId, clinicId }: { scheduleId: string; clinicId: string }) => {
      const res = await fetch(
        `/api/doctors/${doctorId}/schedules/${scheduleId}?clinic_id=${clinicId}`,
        { method: "DELETE" }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to delete schedule")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-schedules", doctorId] })
    },
  })
}

// ─── Override Hooks ──────────────────────────────────────────────

/** Fetch upcoming overrides for a doctor at a clinic */
export function useDoctorOverrides(doctorId: string | null, clinicId: string | null) {
  return useQuery<{ data: ScheduleOverride[] }>({
    queryKey: ["doctor-overrides", doctorId, clinicId],
    queryFn: async () => {
      const res = await fetch(
        `/api/doctors/${doctorId}/overrides?clinic_id=${clinicId}`
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch overrides")
      }
      return res.json()
    },
    enabled: !!doctorId && !!clinicId,
  })
}

/** Mutation: create a new override */
export function useCreateOverride(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateOverrideInput) => {
      const res = await fetch(`/api/doctors/${doctorId}/overrides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create override")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-overrides", doctorId] })
    },
  })
}

/** Mutation: delete an override */
export function useDeleteOverride(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ overrideId, clinicId }: { overrideId: string; clinicId: string }) => {
      const res = await fetch(
        `/api/doctors/${doctorId}/overrides/${overrideId}?clinic_id=${clinicId}`,
        { method: "DELETE" }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to delete override")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-overrides", doctorId] })
    },
  })
}

// ─── Available Slots Hook ────────────────────────────────────────

/** Fetch available slots for a doctor on a specific date */
export function useAvailableSlots(
  doctorId: string | null,
  clinicId: string | null,
  date: string | null
) {
  return useQuery<{ data: TimeSlot[] }>({
    queryKey: ["available-slots", doctorId, clinicId, date],
    queryFn: async () => {
      const res = await fetch(
        `/api/doctors/${doctorId}/available-slots?clinic_id=${clinicId}&date=${date}`
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch available slots")
      }
      return res.json()
    },
    enabled: !!doctorId && !!clinicId && !!date,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/hooks/use-doctors.ts
git commit -m "feat: add React Query hooks for doctors, schedules, overrides, and slots"
```

---

## Task 9: Doctor Table Component

**Files:**
- Create: `src/components/doctors/doctor-table.tsx`

Same pattern as `patient-table.tsx`. Displays doctor list in a flat table.

- [ ] **Step 1: Create the component**

Use `/frontend-design` skill. The component receives `doctors: DoctorListItem[]` and `isLoading: boolean` as props. Columns: Name, Specialty, License #, Status (active/inactive badge). Clicking a row navigates to `/doctors/[id]`. Follow the exact same design system as `patient-table.tsx` (white bg, `#e5e5e5` borders, `gray-50` header, `hover:bg-gray-50` rows, no shadows).

```typescript
"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import type { DoctorListItem } from "@/lib/hooks/use-doctors"

type DoctorTableProps = {
  doctors: DoctorListItem[]
  isLoading: boolean
}

export function DoctorTable({ doctors, isLoading }: DoctorTableProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="rounded-md border border-[#e5e5e5] bg-white p-8 text-center text-sm text-gray-500">
        Loading doctors...
      </div>
    )
  }

  if (doctors.length === 0) {
    return (
      <div className="rounded-md border border-[#e5e5e5] bg-white p-8 text-center text-sm text-gray-500">
        No doctors found at this clinic.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-[#e5e5e5] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e5e5] bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-2.5">Name</th>
            <th className="px-4 py-2.5">Specialty</th>
            <th className="px-4 py-2.5">License #</th>
            <th className="px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doc) => (
            <tr
              key={doc.id}
              onClick={() => router.push(`/doctors/${doc.id}`)}
              className="cursor-pointer border-b border-[#e5e5e5] transition-colors last:border-b-0 hover:bg-gray-50"
            >
              <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                {doc.full_name}
              </td>
              <td className="px-4 py-2.5 text-gray-500">
                {doc.specialty ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-gray-500">
                {doc.license_number ?? "—"}
              </td>
              <td className="px-4 py-2.5">
                {doc.is_active ? (
                  <Badge className="bg-green-50 text-green-600 shadow-none hover:bg-green-50">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500 shadow-none hover:bg-gray-100">
                    Inactive
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/doctors/doctor-table.tsx
git commit -m "feat: add DoctorTable component"
```

---

## Task 10: Doctor List Page

**Files:**
- Create: `src/app/(dashboard)/doctors/page.tsx`

Same pattern as `patients/page.tsx` but simpler — no search bar, no "Add Doctor" button, no pagination (doctor lists are small).

- [ ] **Step 1: Create the page**

```typescript
/**
 * Doctor List Page — /doctors
 *
 * Shows all doctors at the current clinic.
 * No "Add Doctor" button — doctors are created via CLI script (create-user.ts)
 * because they need Supabase Auth accounts.
 *
 * Doctors with role "doctor" only see themselves in the list.
 * Admin and secretary see all doctors.
 */

"use client"

import { useClinic } from "@/providers/clinic-provider"
import { useDoctors } from "@/lib/hooks/use-doctors"
import { DoctorTable } from "@/components/doctors/doctor-table"

export default function DoctorsPage() {
  const { activeClinicId } = useClinic()
  const { data, isLoading } = useDoctors(activeClinicId)

  const doctors = data?.data ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[#1a1a1a]">Doctors</h1>
      <DoctorTable doctors={doctors} isLoading={isLoading} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(dashboard)/doctors/page.tsx"
git commit -m "feat: add doctor list page (/doctors)"
```

---

## Task 11: Doctor Profile Form Component

**Files:**
- Create: `src/components/doctors/doctor-profile-form.tsx`

Editable form for name, specialty, license number. Email is read-only. Shows save button only if `canEdit` is true (admin or own doctor).

- [ ] **Step 1: Create the component**

Use `/frontend-design` skill.

```typescript
/**
 * DoctorProfileForm — editable profile section on the doctor detail page.
 *
 * Fields: Full Name (first + last), Email (read-only), Specialty, License Number.
 * Save button only visible when canEdit is true (admin or the doctor themselves).
 */

"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  specialty: z.string().nullable().optional(),
  license_number: z.string().nullable().optional(),
})

export type DoctorProfileFormData = z.infer<typeof profileSchema>

type Props = {
  defaultValues: DoctorProfileFormData
  email: string
  canEdit: boolean
  onSubmit: (data: DoctorProfileFormData) => void
  isSubmitting: boolean
  error?: string | null
}

export function DoctorProfileForm({
  defaultValues,
  email,
  canEdit,
  onSubmit,
  isSubmitting,
  error,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DoctorProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1a1a1a]">Profile</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">First name *</Label>
          <Input
            {...register("first_name")}
            disabled={!canEdit}
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
          {errors.first_name && (
            <p className="text-xs text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Last name *</Label>
          <Input
            {...register("last_name")}
            disabled={!canEdit}
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
          {errors.last_name && (
            <p className="text-xs text-red-600">{errors.last_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Email</Label>
          <Input
            value={email}
            disabled
            className="border-[#e5e5e5] bg-gray-50 shadow-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Specialty</Label>
          <Input
            {...register("specialty")}
            disabled={!canEdit}
            placeholder="Cardiology, Dermatology, etc."
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">License Number</Label>
          <Input
            {...register("license_number")}
            disabled={!canEdit}
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {canEdit && (
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 shadow-none hover:bg-blue-600"
        >
          {isSubmitting ? "Saving..." : "Save Profile"}
        </Button>
      )}
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/doctors/doctor-profile-form.tsx
git commit -m "feat: add DoctorProfileForm component"
```

---

## Task 12: Clinic Settings Form Component

**Files:**
- Create: `src/components/doctors/clinic-settings-form.tsx`

Admin-only form for per-clinic doctor settings (fee, slot duration, overbooking, etc.).

- [ ] **Step 1: Create the component**

Use `/frontend-design` skill.

```typescript
/**
 * ClinicSettingsForm — per-clinic doctor configuration.
 *
 * Fields: Default Slot Duration, Max Daily Appointments, Consultation Fee,
 *         Allows Overbooking (toggle), Max Overbooking Slots (visible if overbooking on).
 *
 * Only admin can edit. Doctors and secretaries see this as read-only.
 */

"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const settingsSchema = z.object({
  default_slot_duration_minutes: z.coerce.number().int().min(5).max(120),
  max_daily_appointments: z.coerce.number().int().min(1).nullable().optional(),
  consultation_fee: z.coerce.number().min(0).nullable().optional(),
  allows_overbooking: z.boolean(),
  max_overbooking_slots: z.coerce.number().int().min(1).nullable().optional(),
})

export type ClinicSettingsFormData = z.infer<typeof settingsSchema>

type Props = {
  defaultValues: ClinicSettingsFormData
  canEdit: boolean
  onSubmit: (data: ClinicSettingsFormData) => void
  isSubmitting: boolean
  error?: string | null
}

export function ClinicSettingsForm({
  defaultValues,
  canEdit,
  onSubmit,
  isSubmitting,
  error,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ClinicSettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  })

  // Watch the overbooking toggle to show/hide max_overbooking_slots
  const allowsOverbooking = useWatch({ control, name: "allows_overbooking" })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1a1a1a]">Clinic Settings</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Default Slot Duration (min)</Label>
          <select
            {...register("default_slot_duration_minutes")}
            disabled={!canEdit}
            className="flex h-9 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {[15, 20, 30, 45, 60].map((min) => (
              <option key={min} value={min}>
                {min} min
              </option>
            ))}
          </select>
          {errors.default_slot_duration_minutes && (
            <p className="text-xs text-red-600">
              {errors.default_slot_duration_minutes.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Max Daily Appointments</Label>
          <Input
            type="number"
            {...register("max_daily_appointments")}
            disabled={!canEdit}
            placeholder="Unlimited"
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Consultation Fee ($)</Label>
          <Input
            type="number"
            step="0.01"
            {...register("consultation_fee")}
            disabled={!canEdit}
            placeholder="0.00"
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="allows_overbooking"
            {...register("allows_overbooking")}
            disabled={!canEdit}
            className="h-4 w-4 rounded border-[#e5e5e5] text-blue-500 focus:ring-blue-500"
          />
          <Label htmlFor="allows_overbooking" className="text-sm text-[#1a1a1a]">
            Allows Overbooking
          </Label>
        </div>

        {allowsOverbooking && (
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">Max Overbooking Slots</Label>
            <Input
              type="number"
              {...register("max_overbooking_slots")}
              disabled={!canEdit}
              placeholder="1"
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {canEdit && (
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 shadow-none hover:bg-blue-600"
        >
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      )}
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/doctors/clinic-settings-form.tsx
git commit -m "feat: add ClinicSettingsForm component"
```

---

## Task 13: Schedule Editor Component

**Files:**
- Create: `src/components/doctors/schedule-editor.tsx`

Row-based weekly schedule editor. Shows blocks grouped by day (Mon-Sun), with "+ Add Time Block" form.

- [ ] **Step 1: Create the component**

Use `/frontend-design` skill. This is the most complex component. Key design decisions:

- Days listed 0-6 (Sun-Sat), but displayed Mon-Sun for UX
- Each day shows its time blocks or "(no schedule configured)"
- Each block row: start time, end time, slot duration, active toggle, delete button
- "+ Add Time Block" button opens an inline form below the table
- Form fields: Day dropdown, Start time, End time, Slot duration (defaults to clinic setting), Valid from, Valid until

```typescript
/**
 * ScheduleEditor — weekly schedule management for a doctor.
 *
 * Shows time blocks grouped by day of week. Each row displays
 * start/end time, slot duration, active status, and a delete button.
 * The "+ Add Time Block" button opens an inline form.
 *
 * Editable by admin and the doctor themselves. Read-only for secretary.
 */

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus } from "lucide-react"
import type { ScheduleBlock } from "@/lib/hooks/use-doctors"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const addBlockSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().min(1, "Required"),
  end_time: z.string().min(1, "Required"),
  slot_duration_minutes: z.coerce.number().int().min(5).max(120).optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
})

type AddBlockFormData = z.infer<typeof addBlockSchema>

type Props = {
  schedules: ScheduleBlock[]
  canEdit: boolean
  isCreating: boolean
  createError?: string | null
  onAdd: (data: AddBlockFormData) => void
  onDelete: (scheduleId: string) => void
  defaultSlotDuration: number
}

export function ScheduleEditor({
  schedules,
  canEdit,
  isCreating,
  createError,
  onAdd,
  onDelete,
  defaultSlotDuration,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddBlockFormData>({
    resolver: zodResolver(addBlockSchema),
    defaultValues: {
      slot_duration_minutes: defaultSlotDuration,
      valid_from: new Date().toISOString().split("T")[0],
    },
  })

  function handleAdd(data: AddBlockFormData) {
    onAdd(data)
    reset()
    setShowAddForm(false)
  }

  // Group schedules by day_of_week
  const byDay = new Map<number, ScheduleBlock[]>()
  for (const s of schedules) {
    const existing = byDay.get(s.day_of_week) ?? []
    existing.push(s)
    byDay.set(s.day_of_week, existing)
  }

  // Display order: Mon(1), Tue(2), ..., Sat(6), Sun(0)
  const dayOrder = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a1a1a]">Weekly Schedule</h2>
        {canEdit && !showAddForm && (
          <Button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 shadow-none hover:bg-blue-600"
            size="sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Time Block
          </Button>
        )}
      </div>

      {/* Schedule table */}
      <div className="overflow-hidden rounded-md border border-[#e5e5e5] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-4 py-2.5">Day</th>
              <th className="px-4 py-2.5">Start</th>
              <th className="px-4 py-2.5">End</th>
              <th className="px-4 py-2.5">Slot Duration</th>
              <th className="px-4 py-2.5">Active</th>
              {canEdit && <th className="px-4 py-2.5 w-16"></th>}
            </tr>
          </thead>
          <tbody>
            {dayOrder.map((day) => {
              const blocks = byDay.get(day)
              if (!blocks || blocks.length === 0) {
                return (
                  <tr key={day} className="border-b border-[#e5e5e5] last:border-b-0">
                    <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                      {DAY_NAMES[day]}
                    </td>
                    <td colSpan={canEdit ? 5 : 4} className="px-4 py-2.5 text-gray-400 italic">
                      No schedule configured
                    </td>
                  </tr>
                )
              }
              return blocks.map((block, idx) => (
                <tr
                  key={block.id}
                  className="border-b border-[#e5e5e5] last:border-b-0"
                >
                  <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                    {idx === 0 ? DAY_NAMES[day] : ""}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {block.start_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {block.end_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {block.slot_duration_minutes} min
                  </td>
                  <td className="px-4 py-2.5">
                    {block.is_active ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => onDelete(block.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete schedule block"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>

      {/* Add Time Block form */}
      {showAddForm && canEdit && (
        <div className="rounded-md border border-[#e5e5e5] bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-[#1a1a1a]">
            New Time Block
          </h3>
          <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Day *</Label>
                <select
                  {...register("day_of_week")}
                  className="flex h-9 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  {dayOrder.map((d) => (
                    <option key={d} value={d}>{DAY_NAMES[d]}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Start time *</Label>
                <Input
                  type="time"
                  {...register("start_time")}
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
                {errors.start_time && (
                  <p className="text-xs text-red-600">{errors.start_time.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">End time *</Label>
                <Input
                  type="time"
                  {...register("end_time")}
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
                {errors.end_time && (
                  <p className="text-xs text-red-600">{errors.end_time.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Slot Duration (min)</Label>
                <select
                  {...register("slot_duration_minutes")}
                  className="flex h-9 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  {[15, 20, 30, 45, 60].map((min) => (
                    <option key={min} value={min}>{min} min</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Valid from</Label>
                <Input
                  type="date"
                  {...register("valid_from")}
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Valid until</Label>
                <Input
                  type="date"
                  {...register("valid_until")}
                  placeholder="Indefinite"
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
              </div>
            </div>

            {createError && (
              <p className="text-sm text-red-600">{createError}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-blue-500 shadow-none hover:bg-blue-600"
                size="sm"
              >
                {isCreating ? "Adding..." : "Add Block"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#e5e5e5] shadow-none"
                onClick={() => { setShowAddForm(false); reset() }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/doctors/schedule-editor.tsx
git commit -m "feat: add ScheduleEditor component (weekly schedule management)"
```

---

## Task 14: Override Manager Component

**Files:**
- Create: `src/components/doctors/override-manager.tsx`

List of upcoming overrides + inline form to add new ones.

- [ ] **Step 1: Create the component**

Use `/frontend-design` skill.

```typescript
/**
 * OverrideManager — manages one-off schedule exceptions.
 *
 * Shows a table of upcoming overrides with date, type (block/available),
 * time range, reason, and delete button.
 * "+ Add Override" button opens an inline form.
 */

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus } from "lucide-react"
import type { ScheduleOverride } from "@/lib/hooks/use-doctors"

const addOverrideSchema = z.object({
  override_date: z.string().min(1, "Date is required"),
  override_type: z.enum(["block", "available"]),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  reason: z.string().optional(),
})

type AddOverrideFormData = z.infer<typeof addOverrideSchema>

type Props = {
  overrides: ScheduleOverride[]
  canEdit: boolean
  isCreating: boolean
  createError?: string | null
  onAdd: (data: AddOverrideFormData) => void
  onDelete: (overrideId: string) => void
}

export function OverrideManager({
  overrides,
  canEdit,
  isCreating,
  createError,
  onAdd,
  onDelete,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddOverrideFormData>({
    resolver: zodResolver(addOverrideSchema),
    defaultValues: { override_type: "block" },
  })

  function handleAdd(data: AddOverrideFormData) {
    onAdd({
      ...data,
      start_time: data.start_time || undefined,
      end_time: data.end_time || undefined,
      reason: data.reason || undefined,
    })
    reset()
    setShowAddForm(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1a1a1a]">Schedule Overrides</h2>
        {canEdit && !showAddForm && (
          <Button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 shadow-none hover:bg-blue-600"
            size="sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Override
          </Button>
        )}
      </div>

      {/* Overrides table */}
      {overrides.length === 0 ? (
        <div className="rounded-md border border-[#e5e5e5] bg-white p-8 text-center text-sm text-gray-500">
          No upcoming overrides.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#e5e5e5] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Time Range</th>
                <th className="px-4 py-2.5">Reason</th>
                {canEdit && <th className="px-4 py-2.5 w-16"></th>}
              </tr>
            </thead>
            <tbody>
              {overrides.map((ov) => (
                <tr
                  key={ov.id}
                  className="border-b border-[#e5e5e5] last:border-b-0"
                >
                  <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                    {ov.override_date}
                  </td>
                  <td className="px-4 py-2.5">
                    {ov.override_type === "block" ? (
                      <Badge className="bg-red-50 text-red-600 shadow-none hover:bg-red-50">
                        Block
                      </Badge>
                    ) : (
                      <Badge className="bg-green-50 text-green-600 shadow-none hover:bg-green-50">
                        Available
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {ov.start_time && ov.end_time
                      ? `${ov.start_time.slice(0, 5)} - ${ov.end_time.slice(0, 5)}`
                      : "Full day"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">
                    {ov.reason ?? "—"}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => onDelete(ov.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete override"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Override form */}
      {showAddForm && canEdit && (
        <div className="rounded-md border border-[#e5e5e5] bg-white p-4">
          <h3 className="mb-3 text-sm font-medium text-[#1a1a1a]">
            New Override
          </h3>
          <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Date *</Label>
                <Input
                  type="date"
                  {...register("override_date")}
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
                {errors.override_date && (
                  <p className="text-xs text-red-600">{errors.override_date.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Type *</Label>
                <select
                  {...register("override_type")}
                  className="flex h-9 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  <option value="block">Block (not available)</option>
                  <option value="available">Available (extra hours)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Reason</Label>
                <Input
                  {...register("reason")}
                  placeholder="Vacation, Conference, etc."
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">Start time</Label>
                <Input
                  type="time"
                  {...register("start_time")}
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
                <p className="text-xs text-gray-400">Leave empty for full day</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-[#1a1a1a]">End time</Label>
                <Input
                  type="time"
                  {...register("end_time")}
                  className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
                />
              </div>
            </div>

            {createError && (
              <p className="text-sm text-red-600">{createError}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-blue-500 shadow-none hover:bg-blue-600"
                size="sm"
              >
                {isCreating ? "Adding..." : "Add Override"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#e5e5e5] shadow-none"
                onClick={() => { setShowAddForm(false); reset() }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/doctors/override-manager.tsx
git commit -m "feat: add OverrideManager component (schedule overrides)"
```

---

## Task 15: Slots Preview Component

**Files:**
- Create: `src/components/doctors/slots-preview.tsx`

Date picker + grid of time slot chips (green = available, gray = booked).

- [ ] **Step 1: Create the component**

Use `/frontend-design` skill.

```typescript
/**
 * SlotsPreview — date picker + slot chips grid.
 *
 * Allows checking availability for any date within the booking window.
 * Green chip = available slot, Gray chip = booked slot.
 * All roles can view this section.
 */

"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAvailableSlots } from "@/lib/hooks/use-doctors"

type Props = {
  doctorId: string
  clinicId: string
}

export function SlotsPreview({ doctorId, clinicId }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const { data, isLoading, error } = useAvailableSlots(
    doctorId,
    clinicId,
    selectedDate || null
  )

  const slots = data?.data ?? []

  // Date range: today to +60 days
  const today = new Date().toISOString().split("T")[0]
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 60)
  const maxDateStr = maxDate.toISOString().split("T")[0]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1a1a1a]">Slots Preview</h2>

      <div className="max-w-xs space-y-1.5">
        <Label className="text-sm text-[#1a1a1a]">Check date</Label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={today}
          max={maxDateStr}
          className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
        />
      </div>

      {!selectedDate && (
        <p className="text-sm text-gray-400">
          Select a date to preview available time slots.
        </p>
      )}

      {selectedDate && isLoading && (
        <p className="text-sm text-gray-500">Loading slots...</p>
      )}

      {selectedDate && error && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}

      {selectedDate && !isLoading && !error && slots.length === 0 && (
        <p className="text-sm text-gray-500">
          No slots configured for this date.
        </p>
      )}

      {selectedDate && !isLoading && slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <div
              key={slot.slot_start}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                slot.is_available
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-gray-200 bg-gray-100 text-gray-500"
              }`}
            >
              {slot.slot_start.slice(0, 5)} - {slot.slot_end.slice(0, 5)}
              {!slot.is_available && (
                <span className="ml-1.5 text-gray-400">Booked</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/doctors/slots-preview.tsx
git commit -m "feat: add SlotsPreview component (date picker + slot chips)"
```

---

## Task 16: Doctor Detail Page (All 5 Sections)

**Files:**
- Create: `src/app/(dashboard)/doctors/[id]/page.tsx`

The main page that brings all 5 sections together: Profile, Clinic Settings, Weekly Schedule, Overrides, Slots Preview. Handles permission logic (who can edit what).

- [ ] **Step 1: Create the page**

```typescript
/**
 * Doctor Detail Page — /doctors/[id]
 *
 * Shows all 5 sections of a doctor's configuration:
 * 1. Profile (name, email, specialty, license)
 * 2. Clinic Settings (fee, slot duration, overbooking)
 * 3. Weekly Schedule (time blocks by day)
 * 4. Schedule Overrides (vacations, sick days, extra hours)
 * 5. Slots Preview (check availability by date)
 *
 * Permissions:
 * - Admin: can edit everything
 * - Doctor (own page): can edit profile, schedule, overrides. Read-only clinic settings.
 * - Secretary: read-only everything
 */

"use client"

import { use } from "react"
import Link from "next/link"
import { useClinic } from "@/providers/clinic-provider"
import { useAuth } from "@/providers/auth-provider"
import {
  useDoctor,
  useUpdateDoctor,
  useUpdateDoctorSettings,
  useDoctorSchedules,
  useCreateSchedule,
  useDeleteSchedule,
  useDoctorOverrides,
  useCreateOverride,
  useDeleteOverride,
} from "@/lib/hooks/use-doctors"
import { DoctorProfileForm, type DoctorProfileFormData } from "@/components/doctors/doctor-profile-form"
import { ClinicSettingsForm, type ClinicSettingsFormData } from "@/components/doctors/clinic-settings-form"
import { ScheduleEditor } from "@/components/doctors/schedule-editor"
import { OverrideManager } from "@/components/doctors/override-manager"
import { SlotsPreview } from "@/components/doctors/slots-preview"
import { ArrowLeft } from "lucide-react"

export default function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: doctorId } = use(params)
  const { activeClinicId, activeRole } = useClinic()
  const { staffRecord } = useAuth()

  // ─── Data fetching ─────────────────────────────────────────
  const { data: doctorData, isLoading, error } = useDoctor(doctorId, activeClinicId)
  const { data: schedulesData } = useDoctorSchedules(doctorId, activeClinicId)
  const { data: overridesData } = useDoctorOverrides(doctorId, activeClinicId)

  // ─── Mutations ─────────────────────────────────────────────
  const updateDoctor = useUpdateDoctor(doctorId)
  const updateSettings = useUpdateDoctorSettings(doctorId)
  const createSchedule = useCreateSchedule(doctorId)
  const deleteSchedule = useDeleteSchedule(doctorId)
  const createOverride = useCreateOverride(doctorId)
  const deleteOverride = useDeleteOverride(doctorId)

  // ─── Permission logic ─────────────────────────────────────
  const doctor = doctorData?.data
  const isAdmin = activeRole === "admin"
  const isOwnDoctor = staffRecord?.id === doctor?.staff_id
  const canEditProfile = isAdmin || isOwnDoctor
  const canEditSettings = isAdmin
  const canEditSchedule = isAdmin || isOwnDoctor

  // ─── Handlers ──────────────────────────────────────────────
  function handleProfileSubmit(data: DoctorProfileFormData) {
    if (!activeClinicId) return
    updateDoctor.mutate({ clinic_id: activeClinicId, ...data })
  }

  function handleSettingsSubmit(data: ClinicSettingsFormData) {
    if (!activeClinicId) return
    updateSettings.mutate({ clinic_id: activeClinicId, ...data })
  }

  function handleAddSchedule(data: {
    day_of_week: number
    start_time: string
    end_time: string
    slot_duration_minutes?: number
    valid_from?: string
    valid_until?: string
  }) {
    if (!activeClinicId) return
    createSchedule.mutate({ clinic_id: activeClinicId, ...data })
  }

  function handleDeleteSchedule(scheduleId: string) {
    if (!activeClinicId) return
    deleteSchedule.mutate({ scheduleId, clinicId: activeClinicId })
  }

  function handleAddOverride(data: {
    override_date: string
    override_type: "block" | "available"
    start_time?: string
    end_time?: string
    reason?: string
  }) {
    if (!activeClinicId) return
    createOverride.mutate({
      clinic_id: activeClinicId,
      override_date: data.override_date,
      override_type: data.override_type,
      start_time: data.start_time ?? null,
      end_time: data.end_time ?? null,
      reason: data.reason ?? null,
    })
  }

  function handleDeleteOverride(overrideId: string) {
    if (!activeClinicId) return
    deleteOverride.mutate({ overrideId, clinicId: activeClinicId })
  }

  // ─── Loading / Error states ────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-gray-500">
        Loading doctor...
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className="space-y-4">
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to doctors
        </Link>
        <div className="rounded-md border border-[#e5e5e5] bg-white p-8 text-center text-sm text-red-600">
          {error?.message || "Doctor not found"}
        </div>
      </div>
    )
  }

  const schedules = schedulesData?.data ?? []
  const overrides = overridesData?.data ?? []
  const defaultSlotDuration = doctor.clinic_settings?.default_slot_duration_minutes ?? 30

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/doctors"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to doctors
      </Link>

      {/* Doctor name heading */}
      <h1 className="text-2xl font-semibold text-[#1a1a1a]">
        {doctor.last_name}, {doctor.first_name}
      </h1>

      {/* Section 1: Profile */}
      <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
        <DoctorProfileForm
          defaultValues={{
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            specialty: doctor.specialty,
            license_number: doctor.license_number,
          }}
          email={doctor.email}
          canEdit={canEditProfile}
          onSubmit={handleProfileSubmit}
          isSubmitting={updateDoctor.isPending}
          error={updateDoctor.error?.message}
        />
      </div>

      {/* Section 2: Clinic Settings */}
      {doctor.clinic_settings && (
        <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
          <ClinicSettingsForm
            defaultValues={{
              default_slot_duration_minutes: doctor.clinic_settings.default_slot_duration_minutes,
              max_daily_appointments: doctor.clinic_settings.max_daily_appointments,
              consultation_fee: doctor.clinic_settings.consultation_fee,
              allows_overbooking: doctor.clinic_settings.allows_overbooking ?? false,
              max_overbooking_slots: doctor.clinic_settings.max_overbooking_slots,
            }}
            canEdit={canEditSettings}
            onSubmit={handleSettingsSubmit}
            isSubmitting={updateSettings.isPending}
            error={updateSettings.error?.message}
          />
        </div>
      )}

      {/* Section 3: Weekly Schedule */}
      <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
        <ScheduleEditor
          schedules={schedules}
          canEdit={canEditSchedule}
          isCreating={createSchedule.isPending}
          createError={createSchedule.error?.message}
          onAdd={handleAddSchedule}
          onDelete={handleDeleteSchedule}
          defaultSlotDuration={defaultSlotDuration}
        />
      </div>

      {/* Section 4: Schedule Overrides */}
      <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
        <OverrideManager
          overrides={overrides}
          canEdit={canEditSchedule}
          isCreating={createOverride.isPending}
          createError={createOverride.error?.message}
          onAdd={handleAddOverride}
          onDelete={handleDeleteOverride}
        />
      </div>

      {/* Section 5: Slots Preview */}
      {activeClinicId && (
        <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
          <SlotsPreview doctorId={doctorId} clinicId={activeClinicId} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(dashboard)/doctors/[id]/page.tsx"
git commit -m "feat: add doctor detail page with all 5 sections"
```

---

## Task 17: Build Verification + Final Commit

- [ ] **Step 1: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: No errors. If there are type errors, fix them.

- [ ] **Step 2: Run the dev server to verify pages load**

```bash
npx next build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Manual smoke test**

Start dev server (`npm run dev`), navigate to:
1. `/doctors` — should show doctor list table
2. `/doctors/[id]` — should show all 5 sections
3. Try the "Add Time Block" form
4. Try the "Add Override" form
5. Try the Slots Preview date picker

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address build issues from doctor section implementation"
```
