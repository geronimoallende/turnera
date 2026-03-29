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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 1. Parse and validate the body
  const body = await request.json()
  const parsed = updateSettingsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 }
    )
  }

  // 2. Separate clinic_id from the fields to update
  const { clinic_id, ...updateData } = parsed.data

  // 3. Check there's at least one field to update
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // 4. Update the settings row, filtered by both doctor_id and clinic_id.
  //    This ensures you can only update settings for clinics you have access to (RLS).
  const { error: updateError } = await supabase
    .from("doctor_clinic_settings")
    .update(updateData)
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // 5. Re-fetch the updated row to return the latest state
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
