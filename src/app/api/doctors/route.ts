/**
 * API Route: /api/doctors
 *
 * GET /api/doctors?clinic_id=xxx
 *   → Returns all doctors active at a specific clinic.
 *   → Queries `doctor_clinic_settings` joined to `doctors` and `staff`
 *     so we get both the per-clinic config (fee, slot duration, active status)
 *     and the doctor's personal info (name, email, specialty) in one query.
 *   → Flattens the nested Supabase join response into a clean flat object.
 *
 * RLS ensures you can only see doctors at clinics you belong to.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// ─── Validation Schema ────────────────────────────────────────────

/** Schema for GET query parameters */
const listSchema = z.object({
  clinic_id: z.uuid(),
})

// ─── GET: List doctors at a clinic ───────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Parse and validate query parameters
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = listSchema.safeParse(params)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 }
    )
  }

  const { clinic_id } = parsed.data

  // 2. Create a server-side Supabase client (reads JWT from cookies)
  const supabase = await createClient()

  // 3. Query doctor_clinic_settings, joining doctors and staff.
  //    This gives us clinic-specific config + global doctor profile in one trip.
  //    The `!inner` suffix means "only return rows where the join succeeds"
  //    (equivalent to INNER JOIN — skips settings rows with no matching doctor/staff).
  const { data, error } = await supabase
    .from("doctor_clinic_settings")
    .select(
      `
      id,
      doctor_id,
      is_active,
      consultation_fee,
      default_slot_duration_minutes,
      doctors!inner (
        id,
        staff_id,
        specialty,
        license_number,
        staff!inner (
          first_name,
          last_name,
          email
        )
      )
    `
    )
    .eq("clinic_id", clinic_id)
    .order("is_active", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 4. Flatten the nested join response into a clean, flat array.
  //    Supabase returns nested objects for joined tables, but the UI
  //    works much more easily with a flat structure.
  const flattened = (data ?? []).map((row) => {
    const doctor = row.doctors as {
      id: string
      staff_id: string
      specialty: string | null
      license_number: string | null
      staff: {
        first_name: string
        last_name: string
        email: string
      }
    }

    return {
      // doctor_clinic_settings fields
      id: row.id,                                      // settings row UUID
      doctor_id: row.doctor_id,                        // doctors table UUID
      staff_id: doctor.staff_id,                       // staff table UUID
      is_active: row.is_active,
      consultation_fee: row.consultation_fee,
      default_slot_duration_minutes: row.default_slot_duration_minutes,
      // doctor profile fields (from doctors + staff joins)
      specialty: doctor.specialty,
      license_number: doctor.license_number,
      full_name: `${doctor.staff.first_name} ${doctor.staff.last_name}`,
      email: doctor.staff.email,
    }
  })

  return NextResponse.json({ data: flattened })
}
