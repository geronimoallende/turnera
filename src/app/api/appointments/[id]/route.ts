/**
 * API Route: /api/appointments/[id]
 *
 * GET  /api/appointments/abc-123?clinic_id=xyz
 *   → Returns full appointment detail (all fields + doctor + patient)
 *   → Used by the side panel when you click an appointment block
 *
 * PUT  /api/appointments/abc-123
 *   → Updates appointment details (reason, notes, duration)
 *   → NOT for status changes — that's a separate endpoint
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

// All appointment fields + full doctor and patient data
// This is more detailed than the list endpoint — includes email, date_of_birth, etc.
const APPOINTMENT_DETAIL_SELECT = `
  id, appointment_date, start_time, end_time, duration_minutes,
  status, reason, internal_notes, is_overbooking, is_entreturno,
  source, modality, checked_in_at, started_at, completed_at,
  cancelled_at, cancellation_reason, actual_duration_minutes,
  payment_status, created_at, updated_at,
  doctors!inner(id, first_name, last_name, specialty),
  clinic_patients!inner(id, first_name, last_name, dni, phone, email,
    insurance_provider, insurance_plan, no_show_count, date_of_birth)
`

// ─── GET: Single appointment detail ──────────────────────────────

export const GET = withErrorHandler(async (request: NextRequest, context) => {
  // In Next.js 16, dynamic route params ([id]) are accessed as a Promise
  // The folder is named [id], so the URL /api/appointments/abc-123
  // gives us params.id = "abc-123"
  const { id } = await context!.params

  // clinic_id comes as a query parameter, not in the URL path
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")
  if (!clinic_id) {
    throw new ApiError("clinic_id query parameter is required", 400, "MISSING_PARAM")
  }

  const supabase = await createClient()

  // Fetch the appointment by ID, scoped to the clinic (RLS safety)
  // .maybeSingle() returns null instead of error if not found
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_DETAIL_SELECT)
    .eq("id", id)
    .eq("clinic_id", clinic_id)
    .maybeSingle()

  if (error) throw new ApiError(error.message, 500, "DB_ERROR")
  if (!data) throw new ApiError("Appointment not found", 404, "NOT_FOUND")

  return NextResponse.json({ data })
})

// ─── PUT: Update appointment details ─────────────────────────────

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

  // Don't allow empty updates (nothing to change)
  if (Object.keys(updateData).length === 0) {
    throw new ApiError("No fields to update", 400, "NO_FIELDS")
  }

  const supabase = await createClient()

  // If duration changed, we need to recalculate end_time
  // Example: start_time is 09:30, new duration is 45 min → end_time becomes 10:15
  if (updateData.duration_minutes) {
    // First get the current start_time
    const { data: current } = await supabase
      .from("appointments")
      .select("start_time")
      .eq("id", id)
      .eq("clinic_id", clinic_id)
      .single()

    if (current) {
      const [h, m] = current.start_time.split(":").map(Number)
      const endTotalMinutes = h * 60 + m + updateData.duration_minutes
      const endTime = `${String(Math.floor(endTotalMinutes / 60)).padStart(2, "0")}:${String(endTotalMinutes % 60).padStart(2, "0")}`
      // Add end_time to the update — TypeScript doesn't know about it
      // because it's not in the zod schema, so we cast
      ;(updateData as Record<string, unknown>).end_time = endTime
    }
  }

  // Update the appointment
  const { error: updateError } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", id)
    .eq("clinic_id", clinic_id)

  if (updateError) throw new ApiError(updateError.message, 500, "DB_ERROR")

  // Re-fetch the full appointment to return updated data
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_DETAIL_SELECT)
    .eq("id", id)
    .eq("clinic_id", clinic_id)
    .single()

  if (error) throw new ApiError(error.message, 500, "DB_ERROR")

  return NextResponse.json({ data })
})
