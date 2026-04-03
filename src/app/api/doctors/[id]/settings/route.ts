/**
 * API Route: /api/doctors/[id]/settings
 *
 * PUT /api/doctors/[id]/settings
 *   → Updates the `doctor_clinic_settings` row for a specific doctor + clinic.
 *   → These are per-clinic configuration values (fee, slot duration, overbooking, etc.)
 *     that can differ between clinics if the same doctor works at multiple places.
 *
 * The [id] is the `doctors.id` UUID.
 * clinic_id must be passed in the request body.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { checkDoctorPermission } from "@/lib/auth/check-doctor-permission"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

// ─── Validation Schema ────────────────────────────────────────────

const updateSettingsSchema = z.object({
  clinic_id: z.uuid(),
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
