/**
 * API Route: /api/doctors/[id]/overrides
 *
 * Manages one-off schedule exceptions (vacations, sick days, extra hours).
 * Unlike recurring `doctor_schedules`, each override applies to a single date.
 *
 * Override types:
 * - "block"     → doctor is NOT available on this date (or specific time range)
 * - "available" → doctor IS available on this date (overrides their usual day off)
 *
 * GET /api/doctors/[id]/overrides?clinic_id=xxx
 *   → Returns upcoming overrides (today and future), ordered by date ascending.
 *   → Past overrides are excluded — no need to display expired exceptions.
 *
 * POST /api/doctors/[id]/overrides
 *   → Creates a new override.
 *   → Validates the date is today or in the future (can't override the past).
 *   → Validates the date is within the clinic's booking window (max_booking_days_ahead).
 *   → Validates end_time > start_time if a time range is provided.
 *
 * [id] = doctors.id
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { checkDoctorPermission } from "@/lib/auth/check-doctor-permission"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

// ─── Validation Schemas ───────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^\d{2}:\d{2}$/

const listSchema = z.object({
  clinic_id: z.uuid(),
})

const createSchema = z.object({
  clinic_id: z.uuid(),
  override_date: z.string().regex(dateRegex, "Must be YYYY-MM-DD format"),
  override_type: z.enum(["block", "available"]),
  start_time: z.string().regex(timeRegex, "Must be HH:MM format").nullable().optional(),
  end_time: z.string().regex(timeRegex, "Must be HH:MM format").nullable().optional(),
  reason: z.string().nullable().optional(),
})

// ─── GET: List upcoming overrides ────────────────────────────────

export const GET = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  const { id } = await context!.params

  const rawParams = Object.fromEntries(request.nextUrl.searchParams)
  const { clinic_id } = listSchema.parse(rawParams)

  const supabase = await createClient()

  // Get today's date as YYYY-MM-DD string (in UTC — safe for date comparisons)
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("schedule_overrides")
    .select("*")
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)
    .gte("override_date", today) // only upcoming overrides
    .order("override_date", { ascending: true })

  if (error) {
    throw new ApiError(error.message, 500, "INTERNAL_ERROR")
  }

  return NextResponse.json({ data })
})

// ─── POST: Create an override ─────────────────────────────────────

export const POST = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  const { id } = await context!.params

  const body = await request.json()
  const {
    clinic_id,
    override_date,
    override_type,
    start_time,
    end_time,
    reason,
  } = createSchema.parse(body)

  // 1. Validate date is today or in the future (can't modify the past)
  const today = new Date().toISOString().split("T")[0]
  if (override_date < today) {
    throw new ApiError("override_date cannot be in the past", 400, "VALIDATION_ERROR")
  }

  // 2. Validate end_time > start_time if a partial time range is provided
  if (start_time && end_time && end_time <= start_time) {
    throw new ApiError("end_time must be after start_time", 400, "VALIDATION_ERROR")
  }

  const supabase = await createClient()

  // 3. Verify the caller has permission to create overrides for this doctor.
  //    Admin can manage any doctor's overrides. A doctor can manage only their own.
  const permission = await checkDoctorPermission(supabase, clinic_id, id)
  if (!permission.authorized) {
    throw new ApiError(permission.error, permission.status, "FORBIDDEN")
  }

  // 4. Validate date is within the clinic's booking window.
  //    Clinics configure how far ahead appointments can be booked
  //    (e.g., 60 days). Overrides beyond that window serve no purpose.
  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select("max_booking_days_ahead")
    .eq("id", clinic_id)
    .single()

  if (clinicError || !clinic) {
    throw new ApiError("Clinic not found", 404, "NOT_FOUND")
  }

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + clinic.max_booking_days_ahead)
  const maxDateStr = maxDate.toISOString().split("T")[0]

  if (override_date > maxDateStr) {
    throw new ApiError(
      `override_date cannot be more than ${clinic.max_booking_days_ahead} days ahead`,
      400,
      "VALIDATION_ERROR"
    )
  }

  // 5. Insert the override
  const { data, error } = await supabase
    .from("schedule_overrides")
    .insert({
      doctor_id: id,
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
    throw new ApiError(error.message, 500, "INTERNAL_ERROR")
  }

  return NextResponse.json({ data }, { status: 201 })
})
