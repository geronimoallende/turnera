/**
 * API Route: /api/appointments/[id]/reschedule
 *
 * POST /api/appointments/abc-123/reschedule
 *   → Moves an appointment to a new date/time
 *   → Does NOT modify the original — creates a NEW appointment and links them
 *   → Original is marked as "rescheduled" (immutable audit trail)
 *
 * Why create a new one instead of modifying the original?
 * Because the appointment_history table (audit log) tracks every appointment
 * independently. If we modified the original, we'd lose the record of when
 * the original time was. By creating a new one and linking them, both records
 * exist: "Patient was at 09:00, got rescheduled to 10:30."
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"
import { TERMINAL_STATUSES } from "@/lib/constants/appointment-status"

const rescheduleSchema = z.object({
  clinic_id: z.string().uuid(),
  new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  new_start_time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  new_duration_minutes: z.coerce.number().int().min(5).max(120).optional(),
})

export const POST = withErrorHandler(async (request: NextRequest, context) => {
  const { id } = await context!.params
  const body = await request.json()
  const { clinic_id, new_date, new_start_time, new_duration_minutes } =
    rescheduleSchema.parse(body)

  const supabase = await createClient()

  // ── Step 1: Get the original appointment ─────────────────────
  const { data: original, error: fetchError } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .eq("clinic_id", clinic_id)
    .single()

  if (fetchError || !original) {
    throw new ApiError("Appointment not found", 404, "NOT_FOUND")
  }

  // Can't reschedule something that's already done
  // (completed, no_show, already cancelled, already rescheduled)
  if (TERMINAL_STATUSES.includes(original.status)) {
    throw new ApiError(
      `Cannot reschedule a ${original.status} appointment`,
      400,
      "INVALID_STATUS"
    )
  }

  // ── Step 2: Calculate new end_time ───────────────────────────
  // Use the new duration if provided, otherwise keep the original duration
  const duration = new_duration_minutes || original.duration_minutes
  const [h, m] = new_start_time.split(":").map(Number)
  const endTotalMinutes = h * 60 + m + duration
  const end_time = `${String(Math.floor(endTotalMinutes / 60)).padStart(2, "0")}:${String(endTotalMinutes % 60).padStart(2, "0")}`

  // ── Step 3: Get staff ID for created_by ──────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user!.id)
    .single()

  // ── Step 4: Create the NEW appointment ───────────────────────
  // Copies everything from the original (same doctor, same patient, same reason)
  // but with the new date/time and a link back to the original via rescheduled_from_id
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
      rescheduled_from_id: original.id, // ← link to original
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

  // ── Step 5: Mark the original as rescheduled ─────────────────
  // The original appointment stays in the database forever (audit trail)
  // but its status changes to "rescheduled" and it points to the new one
  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      status: "rescheduled",
      rescheduled_to_id: newAppt.id, // ← link to new
    })
    .eq("id", id)

  if (updateError) throw new ApiError(updateError.message, 500, "DB_ERROR")

  return NextResponse.json(
    { data: newAppt, message: "Appointment rescheduled" },
    { status: 201 }
  )
})
