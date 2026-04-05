/**
 * API Route: /api/doctors/[id]/settings
 *
 * PUT /api/doctors/[id]/settings
 *   → Updates the `doctor_clinic_settings` row for a specific doctor + clinic.
 *   → These are per-clinic configuration values (fee, slot duration, overbooking, etc.)
 *     that can differ between clinics if the same doctor works at multiple places.
 *
 * DELETE /api/doctors/[id]/settings?clinic_id=xxx
 *   → Soft-deactivates a doctor at a clinic (sets is_active=false).
 *   → Does NOT delete any data — the doctor's records, appointments, and history
 *     remain intact. They just won't appear in the active doctor list anymore.
 *   → Also deactivates the staff_clinics row so they lose access to this clinic.
 *   → Admin only. A doctor cannot deactivate themselves.
 *   → Reversible: PUT with is_active=true to reactivate.
 *
 * The [id] is the `doctors.id` UUID.
 * clinic_id must be passed in the request body (PUT) or query params (DELETE).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { checkDoctorPermission } from "@/lib/auth/check-doctor-permission"
import { withErrorHandler, ApiError } from "@/lib/error-handler"
import { logger } from "@/lib/logger"

// ─── Validation Schema ────────────────────────────────────────────

const updateSettingsSchema = z.object({
  clinic_id: z.string().uuid(),
  default_slot_duration_minutes: z.number().int().min(5).max(120).optional(),
  max_daily_appointments: z.number().int().min(1).nullable().optional(),
  consultation_fee: z.number().min(0).nullable().optional(),
  allows_overbooking: z.boolean().optional(),
  max_overbooking_slots: z.number().int().min(1).nullable().optional(),
  is_active: z.boolean().optional(),
  virtual_enabled: z.boolean().optional(),
  virtual_link: z.string().nullable().optional(),
})

// ─── PUT: Update clinic-specific doctor settings ──────────────────

export const PUT = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  const { id } = await context!.params

  // 1. Parse and validate the body
  const body = await request.json()
  const { clinic_id, ...updateData } = updateSettingsSchema.parse(body)

  // 3. Check there's at least one field to update
  if (Object.keys(updateData).length === 0) {
    throw new ApiError("No fields to update", 400, "VALIDATION_ERROR")
  }

  const supabase = await createClient()

  // 4. Verify the caller is an admin — clinic settings are admin-only.
  //    Doctors can adjust their own schedule/profile but not clinic-level config.
  const permission = await checkDoctorPermission(supabase, clinic_id, id, true)
  if (!permission.authorized) {
    throw new ApiError(permission.error, permission.status, "FORBIDDEN")
  }

  // 5. Update the settings row, filtered by both doctor_id and clinic_id.
  //    This ensures you can only update settings for clinics you have access to (RLS).
  const { error: updateError } = await supabase
    .from("doctor_clinic_settings")
    .update(updateData)
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)

  if (updateError) {
    throw new ApiError(updateError.message, 500, "INTERNAL_ERROR")
  }

  // 6. Re-fetch the updated row to return the latest state
  const { data, error } = await supabase
    .from("doctor_clinic_settings")
    .select(
      `
      id,
      doctor_id,
      clinic_id,
      is_active,
      consultation_fee,
      default_slot_duration_minutes,
      max_daily_appointments,
      allows_overbooking,
      max_overbooking_slots,
      virtual_enabled,
      virtual_link
    `
    )
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)
    .single()

  if (error) {
    throw new ApiError(error.message, 500, "INTERNAL_ERROR")
  }

  return NextResponse.json({ data })
})

// ─── DELETE: Soft-deactivate a doctor at a clinic ───────────────

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  const { id } = await context!.params

  // 1. Get clinic_id from query params (DELETE requests don't have a body)
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")
  if (!clinic_id) {
    throw new ApiError("clinic_id query parameter is required", 400, "MISSING_PARAM")
  }

  const supabase = await createClient()

  // 2. Only admins can deactivate doctors at a clinic.
  //    adminOnly=true means even the doctor themselves can't do this.
  const permission = await checkDoctorPermission(supabase, clinic_id, id, true)
  if (!permission.authorized) {
    throw new ApiError(permission.error, permission.status, "FORBIDDEN")
  }

  // 3. Soft-deactivate the doctor_clinic_settings row.
  //    is_active=false means they won't show up in the active doctors list,
  //    won't appear in the calendar, and can't receive new appointments.
  const { error: settingsError } = await supabase
    .from("doctor_clinic_settings")
    .update({ is_active: false })
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)

  if (settingsError) {
    throw new ApiError(settingsError.message, 500, "DB_ERROR")
  }

  // 4. Also deactivate the staff_clinics row so they lose login access
  //    to this clinic. We need to look up staff_id from the doctors table first.
  const { data: doctor } = await supabase
    .from("doctors")
    .select("staff_id")
    .eq("id", id)
    .single()

  if (doctor) {
    const { error: staffClinicError } = await supabase
      .from("staff_clinics")
      .update({ is_active: false })
      .eq("staff_id", doctor.staff_id)
      .eq("clinic_id", clinic_id)

    if (staffClinicError) {
      throw new ApiError(staffClinicError.message, 500, "DB_ERROR")
    }
  }

  logger.info(
    { doctorId: id, clinicId: clinic_id },
    "Doctor deactivated at clinic"
  )

  return NextResponse.json({
    message: "Doctor deactivated at this clinic",
  })
})
