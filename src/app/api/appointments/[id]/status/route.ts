/**
 * API Route: /api/appointments/[id]/status
 *
 * PATCH /api/appointments/abc-123/status
 *   → Changes an appointment's status (confirmed → arrived → in_progress → completed)
 *   → Validates that the transition is allowed (can't go from arrived → confirmed)
 *   → Checks role permissions (doctors can't mark arrived/no_show)
 *   → Sets timestamps automatically (checked_in_at, started_at, completed_at, etc.)
 *
 * This is separate from PUT /api/appointments/[id] because status changes
 * have complex business logic (transition rules, permissions, side effects)
 * while regular updates are simple field changes.
 */

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

  // ── Step 1: Get the current appointment ──────────────────────
  // We need the current status to validate the transition,
  // and the doctor_id to check if a doctor is modifying their own appointment.

  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, status, doctor_id")
    .eq("id", id)
    .eq("clinic_id", clinic_id)
    .single()

  if (fetchError || !appointment) {
    throw new ApiError("Appointment not found", 404, "NOT_FOUND")
  }

  // ── Step 2: Validate the transition ──────────────────────────
  // Not every status can go to every other status. For example:
  //   confirmed → arrived ✅ (patient showed up)
  //   arrived → confirmed ❌ (can't go backwards)
  //   in_progress → completed ✅ (doctor finished)
  //   in_progress → arrived ❌ (can't go backwards)
  //
  // isValidTransition() checks the VALID_TRANSITIONS map we defined
  // in appointment-status.ts

  if (!isValidTransition(appointment.status, newStatus)) {
    throw new ApiError(
      `Cannot change status from '${appointment.status}' to '${newStatus}'`,
      400,
      "INVALID_TRANSITION"
    )
  }

  // ── Step 3: Require reason for cancellations ─────────────────
  // When cancelling, the secretary must explain why (e.g., "patient called to cancel")
  // This is stored for audit purposes.

  if (newStatus.startsWith("cancelled") && !cancellation_reason) {
    throw new ApiError("Cancellation reason is required", 400, "MISSING_REASON")
  }

  // ── Step 4: Check role permissions ───────────────────────────
  // Who is allowed to do what:
  //   Admin/Secretary: can do everything
  //   Doctor: can only change their own appointments, and:
  //     - Cannot mark arrived (secretary does this at reception)
  //     - Cannot mark no_show (secretary does this)
  //     - Can start consultation (in_progress) and complete
  //     - Can cancel only if admin enabled can_cancel_appointments

  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  // Apply restrictions for doctors
  if (staffClinic.role === "doctor") {
    // Find which doctor this staff member is
    const { data: doctorRecord } = await supabase
      .from("doctors")
      .select("id")
      .eq("staff_id", staff.id)
      .single()

    // Can only modify their own appointments
    if (!doctorRecord || doctorRecord.id !== appointment.doctor_id) {
      throw new ApiError("Cannot modify another doctor's appointment", 403, "FORBIDDEN")
    }

    // Doctors cannot mark arrived or no_show — that's the secretary's job
    if (newStatus === "arrived" || newStatus === "no_show") {
      throw new ApiError(
        "Only admin or secretary can mark arrived or no-show",
        403,
        "FORBIDDEN"
      )
    }

    // For cancellation, check if the admin enabled this permission
    if (newStatus.startsWith("cancelled")) {
      const { data: settings } = await supabase
        .from("doctor_clinic_settings")
        .select("can_cancel_appointments")
        .eq("doctor_id", doctorRecord.id)
        .eq("clinic_id", clinic_id)
        .single()

      if (!settings?.can_cancel_appointments) {
        throw new ApiError(
          "Doctor does not have permission to cancel appointments",
          403,
          "FORBIDDEN"
        )
      }
    }
  }

  // ── Step 5: Build the update with side effects ───────────────
  // Each status change has automatic side effects — timestamps that
  // record WHEN the change happened. These are used for:
  //   - Wait time calculation (checked_in_at → started_at)
  //   - Consultation time (started_at → completed_at)
  //   - Reports and analytics

  const updateData: Record<string, unknown> = { status: newStatus }

  if (newStatus === "arrived") {
    // Patient just showed up at reception
    updateData.checked_in_at = new Date().toISOString()
  }

  if (newStatus === "in_progress") {
    // Doctor called the patient in
    updateData.started_at = new Date().toISOString()
  }

  if (newStatus === "completed") {
    // Doctor finished the consultation
    const now = new Date()
    updateData.completed_at = now.toISOString()

    // Calculate how long the consultation actually took
    // by comparing started_at to now
    const { data: appt } = await supabase
      .from("appointments")
      .select("started_at")
      .eq("id", id)
      .single()

    if (appt?.started_at) {
      const started = new Date(appt.started_at)
      // Difference in milliseconds → convert to minutes
      updateData.actual_duration_minutes = Math.round(
        (now.getTime() - started.getTime()) / 60000
      )
    }
  }

  if (newStatus.startsWith("cancelled")) {
    updateData.cancelled_at = new Date().toISOString()
    updateData.cancellation_reason = cancellation_reason
  }

  // ── Step 6: Apply the update ─────────────────────────────────

  const { error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", id)
    .eq("clinic_id", clinic_id)

  if (error) throw new ApiError(error.message, 500, "DB_ERROR")

  return NextResponse.json({ message: `Status changed to ${newStatus}` })
})
