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

// ─── Validation Schema ────────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const querySchema = z.object({
  clinic_id: z.uuid(),
  date: z.string().regex(dateRegex, "Must be YYYY-MM-DD format"),
})

// ─── GET: Fetch available time slots ─────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await params

  // 1. Parse and validate query parameters
  const rawParams = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = querySchema.safeParse(rawParams)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 }
    )
  }

  const { clinic_id, date } = parsed.data

  // 2. Validate that date is today or in the future
  const today = new Date().toISOString().split("T")[0]
  if (date < today) {
    return NextResponse.json(
      { error: "date cannot be in the past" },
      { status: 400 }
    )
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
    return NextResponse.json(
      { error: "Clinic not found" },
      { status: 404 }
    )
  }

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + clinic.max_booking_days_ahead)
  const maxDateStr = maxDate.toISOString().split("T")[0]

  if (date > maxDateStr) {
    return NextResponse.json(
      {
        error: `date cannot be more than ${clinic.max_booking_days_ahead} days ahead`,
      },
      { status: 400 }
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: slots })
}
