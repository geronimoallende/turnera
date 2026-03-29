/**
 * API Route: /api/doctors/[id]
 *
 * The [id] here is the `doctors.id` UUID (the global doctor record).
 *
 * GET /api/doctors/[id]?clinic_id=xxx
 *   → Fetches doctor profile from `doctors` + `staff` join.
 *   → Also fetches per-clinic settings from `doctor_clinic_settings`.
 *   → Returns a flat object with nested clinic_settings.
 *
 * PUT /api/doctors/[id]
 *   → Updates the `doctors` table (specialty, license_number).
 *   → Also updates the `staff` table (first_name, last_name).
 *   → Requires clinic_id in the body to verify the doctor belongs to your clinic.
 *
 * Two separate tables are updated because the data is split:
 * - `doctors` holds medical credentials (specialty, license) — global
 * - `staff` holds identity (name, email) — global
 * - `doctor_clinic_settings` holds per-clinic config (fee, schedule) — separate endpoint
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { checkDoctorPermission } from "@/lib/auth/check-doctor-permission"

// ─── Validation Schemas ───────────────────────────────────────────

/** Schema for PUT body */
const updateSchema = z.object({
  clinic_id: z.uuid(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  specialty: z.string().nullable().optional(),
  license_number: z.string().nullable().optional(),
})

// ─── GET: Fetch a single doctor ───────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // In Next.js 15+, params is a Promise — we must await it
  const { id } = await params

  const clinic_id = request.nextUrl.searchParams.get("clinic_id")
  if (!clinic_id) {
    return NextResponse.json(
      { error: "clinic_id query parameter is required" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // 1. Fetch the doctor's global profile from `doctors` joined with `staff`.
  //    We use `id=id` (doctors.id) to find this specific doctor.
  const { data: doctorData, error: doctorError } = await supabase
    .from("doctors")
    .select(
      `
      id,
      staff_id,
      specialty,
      license_number,
      staff!inner (
        first_name,
        last_name,
        email
      )
    `
    )
    .eq("id", id)
    .maybeSingle()

  if (doctorError) {
    return NextResponse.json({ error: doctorError.message }, { status: 500 })
  }

  if (!doctorData) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
  }

  // 2. Fetch per-clinic settings for this doctor + clinic combination.
  //    This may be null if the doctor hasn't been linked to this clinic yet.
  const { data: settingsData, error: settingsError } = await supabase
    .from("doctor_clinic_settings")
    .select(
      `
      id,
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
    .maybeSingle()

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 })
  }

  // 3. Type-cast the nested staff join for TypeScript
  const staff = doctorData.staff as {
    first_name: string
    last_name: string
    email: string
  }

  // 4. Return a flat response with clinic_settings nested inside
  return NextResponse.json({
    data: {
      id: doctorData.id,
      staff_id: doctorData.staff_id,
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email,
      specialty: doctorData.specialty,
      license_number: doctorData.license_number,
      clinic_settings: settingsData ?? null,
    },
  })
}

// ─── PUT: Update a doctor's profile ──────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 1. Parse and validate the body
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 }
    )
  }

  const { clinic_id, first_name, last_name, specialty, license_number } = parsed.data

  const supabase = await createClient()

  // 2. Verify the caller has permission to mutate this doctor's record.
  //    Admin can always update any doctor. A doctor can only update their own record.
  //    Secretaries are not allowed to update doctor profiles.
  const permission = await checkDoctorPermission(supabase, clinic_id, id)
  if (!permission.authorized) {
    return NextResponse.json({ error: permission.error }, { status: permission.status })
  }

  // 3. Check there's at least one field to update
  const hasProfileUpdate = specialty !== undefined || license_number !== undefined
  const hasStaffUpdate = first_name !== undefined || last_name !== undefined

  if (!hasProfileUpdate && !hasStaffUpdate) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    )
  }

  // 4. Verify this doctor belongs to the requested clinic.
  //    RLS would block the update anyway, but an explicit check gives a clearer error.
  const { data: settings } = await supabase
    .from("doctor_clinic_settings")
    .select("id")
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)
    .maybeSingle()

  if (!settings) {
    return NextResponse.json(
      { error: "Doctor not found at this clinic" },
      { status: 404 }
    )
  }

  // 5. First, fetch the doctor to get their staff_id (needed to update `staff` table)
  const { data: doctorRow, error: fetchError } = await supabase
    .from("doctors")
    .select("staff_id")
    .eq("id", id)
    .single()

  if (fetchError || !doctorRow) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
  }

  // 5. Update `doctors` table if medical credentials changed
  if (hasProfileUpdate) {
    const doctorUpdate: Record<string, string | null> = {}
    if (specialty !== undefined) doctorUpdate.specialty = specialty
    if (license_number !== undefined) doctorUpdate.license_number = license_number

    const { error: docError } = await supabase
      .from("doctors")
      .update(doctorUpdate)
      .eq("id", id)

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }
  }

  // 6. Update `staff` table if name changed
  if (hasStaffUpdate) {
    const staffUpdate: Record<string, string> = {}
    if (first_name !== undefined) staffUpdate.first_name = first_name
    if (last_name !== undefined) staffUpdate.last_name = last_name

    const { error: staffError } = await supabase
      .from("staff")
      .update(staffUpdate)
      .eq("id", doctorRow.staff_id)

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }
  }

  // 7. Re-fetch the full updated profile to return
  const { data: updated, error: refetchError } = await supabase
    .from("doctors")
    .select(
      `
      id,
      staff_id,
      specialty,
      license_number,
      staff!inner (
        first_name,
        last_name,
        email
      )
    `
    )
    .eq("id", id)
    .single()

  if (refetchError) {
    return NextResponse.json({ error: refetchError.message }, { status: 500 })
  }

  const updatedStaff = updated.staff as {
    first_name: string
    last_name: string
    email: string
  }

  return NextResponse.json({
    data: {
      id: updated.id,
      staff_id: updated.staff_id,
      first_name: updatedStaff.first_name,
      last_name: updatedStaff.last_name,
      email: updatedStaff.email,
      specialty: updated.specialty,
      license_number: updated.license_number,
    },
  })
}
