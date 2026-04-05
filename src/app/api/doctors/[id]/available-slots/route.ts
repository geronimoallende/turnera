/**
 * API Route: /api/doctors/[id]/available-slots
 *
 * GET /api/doctors/[id]/available-slots?clinic_id=xxx&date=YYYY-MM-DD
 *   → Returns all time slots for a specific doctor on a specific date,
 *     each marked as available or taken.
 *   → Calls the Supabase database function `get_available_slots` which handles
 *     the heavy lifting: reading the doctor's schedule, checking existing
 *     appointments, applying overrides, and calculating slot times.
 *
 * Validations:
 *   - date must be today or in the future (can't book in the past)
 *   - date must be within the clinic's max_booking_days_ahead window
 *
 * Note: min_booking_hours_ahead (e.g., "can't book less than 2 hours from now")
 *   is NOT enforced here. That check is applied per-slot at actual booking time
 *   (Week 3 feature). This endpoint returns all slots so the UI can display them,
 *   even if some are "too soon" — the booking step will reject those.
 *
 * [id] = doctors.id
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

// ─── Validation Schema ────────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const querySchema = z.object({
  clinic_id: z.uuidv4(),
  date: z.string().regex(dateRegex, "Must be YYYY-MM-DD format"),
})

// ─── GET: Fetch available time slots ─────────────────────────────

export const GET = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  const { id: doctorId } = await context!.params

  // 1. Parse and validate query parameters
  const rawParams = Object.fromEntries(request.nextUrl.searchParams)
  const { clinic_id, date } = querySchema.parse(rawParams)

  // 2. Validate that date is today or in the future
  const today = new Date().toISOString().split("T")[0]
  if (date < today) {
    throw new ApiError("date cannot be in the past", 400, "VALIDATION_ERROR")
  }

  const supabase = await createClient()

  // 3. Validate date is within the clinic's booking window.
  //    Fetch the clinic to get max_booking_days_ahead.
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

  if (date > maxDateStr) {
    throw new ApiError(
      `date cannot be more than ${clinic.max_booking_days_ahead} days ahead`,
      400,
      "VALIDATION_ERROR"
    )
  }

  // 4. Call the database function `get_available_slots`.
  //    This PostgreSQL function reads the doctor's schedule, applies overrides,
  //    and returns every slot for the day with is_available = true/false.
  //    Using an RPC (Remote Procedure Call) lets complex logic live in the DB
  //    rather than in application code — it's faster and keeps the logic in one place.
  const { data: slots, error } = await supabase.rpc("get_available_slots", {
    p_doctor_id: doctorId,
    p_date: date,
    p_clinic_id: clinic_id,
  })

  if (error) {
    throw new ApiError(error.message, 500, "INTERNAL_ERROR")
  }

  return NextResponse.json({ data: slots })
})
