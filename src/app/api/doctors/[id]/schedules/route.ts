/**
 * API Route: /api/doctors/[id]/schedules
 *
 * Manages recurring weekly schedule blocks for a doctor.
 * Each block represents "this doctor is available on day X from HH:MM to HH:MM".
 *
 * GET /api/doctors/[id]/schedules?clinic_id=xxx
 *   → Returns all schedule blocks for this doctor at this clinic.
 *   → Ordered by day_of_week (0=Sunday, 6=Saturday), then start_time.
 *
 * POST /api/doctors/[id]/schedules
 *   → Creates a new weekly schedule block.
 *   → Validates that end_time > start_time.
 *   → Checks for overlapping blocks on the same day (prevents double-booking).
 *   → If slot_duration_minutes is not provided, falls back to the doctor's
 *     default from doctor_clinic_settings.
 *
 * The [id] is the `doctors.id` UUID.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { checkDoctorPermission } from "@/lib/auth/check-doctor-permission"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

// ─── Validation Schemas ───────────────────────────────────────────

/** HH:MM format regex — e.g., "09:00", "17:30" */
const timeRegex = /^\d{2}:\d{2}$/

const listSchema = z.object({
  clinic_id: z.uuidv4(),
})

const createSchema = z.object({
  clinic_id: z.uuidv4(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(timeRegex, "Must be HH:MM format"),
  end_time: z.string().regex(timeRegex, "Must be HH:MM format"),
  slot_duration_minutes: z.number().int().min(5).max(120).optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().nullable().optional(),
})

// ─── GET: List schedule blocks ────────────────────────────────────

export const GET = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  const { id } = await context!.params

  const rawParams = Object.fromEntries(request.nextUrl.searchParams)
  const { clinic_id } = listSchema.parse(rawParams)

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) {
    throw new ApiError(error.message, 500, "INTERNAL_ERROR")
  }

  return NextResponse.json({ data })
})

// ─── POST: Create a schedule block ───────────────────────────────

export const POST = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  const { id } = await context!.params

  const body = await request.json()
  const {
    clinic_id,
    day_of_week,
    start_time,
    end_time,
    slot_duration_minutes,
    valid_from,
    valid_until,
  } = createSchema.parse(body)

  // 1. Validate that end_time comes after start_time.
  //    We compare as strings — "09:00" < "17:30" works lexicographically for HH:MM.
  if (end_time <= start_time) {
    throw new ApiError("end_time must be after start_time", 400, "VALIDATION_ERROR")
  }

  const supabase = await createClient()

  // 2. Verify the caller has permission to create schedules for this doctor.
  //    Admin can manage any doctor's schedule. A doctor can manage only their own.
  const permission = await checkDoctorPermission(supabase, clinic_id, id)
  if (!permission.authorized) {
    throw new ApiError(permission.error, permission.status, "FORBIDDEN")
  }

  // 3. Check for overlapping schedule blocks on the same day.
  //    Two blocks overlap if one starts before the other ends.
  //    Overlap condition: existing.start_time < new.end_time AND existing.end_time > new.start_time
  const { data: overlapping, error: overlapError } = await supabase
    .from("doctor_schedules")
    .select("id, start_time, end_time")
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)
    .eq("day_of_week", day_of_week)
    .eq("is_active", true)
    .lt("start_time", end_time)   // existing block starts before new block ends
    .gt("end_time", start_time)   // existing block ends after new block starts

  if (overlapError) {
    throw new ApiError(overlapError.message, 500, "INTERNAL_ERROR")
  }

  if (overlapping && overlapping.length > 0) {
    throw new ApiError("Schedule block overlaps with an existing block on this day", 409, "SCHEDULE_OVERLAP")
  }

  // 4. Resolve slot duration — use provided value or fall back to doctor's default
  let resolvedSlotDuration = slot_duration_minutes

  if (resolvedSlotDuration === undefined) {
    const { data: settings } = await supabase
      .from("doctor_clinic_settings")
      .select("default_slot_duration_minutes")
      .eq("doctor_id", id)
      .eq("clinic_id", clinic_id)
      .maybeSingle()

    // Default to 30 minutes if no settings row exists yet
    resolvedSlotDuration = settings?.default_slot_duration_minutes ?? 30
  }

  // 5. Insert the new schedule block
  const { data, error } = await supabase
    .from("doctor_schedules")
    .insert({
      doctor_id: id,
      clinic_id,
      day_of_week,
      start_time,
      end_time,
      slot_duration_minutes: resolvedSlotDuration,
      valid_from: valid_from || null,
      valid_until: valid_until || null,
    })
    .select()
    .single()

  if (error) {
    throw new ApiError(error.message, 500, "INTERNAL_ERROR")
  }

  return NextResponse.json({ data }, { status: 201 })
})
