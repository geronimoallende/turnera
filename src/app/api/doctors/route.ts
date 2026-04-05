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
 * POST /api/doctors
 *   → Creates a brand-new doctor who doesn't exist in the system yet.
 *   → Three-step process:
 *     1. Create an auth user via Supabase Admin API (service_role key)
 *     2. Call create_doctor_at_clinic() DB function (atomically creates
 *        staff + staff_clinics + doctors + doctor_clinic_settings)
 *     3. If step 2 fails, delete the auth user (cleanup)
 *   → Only admins can create doctors (enforced by the DB function).
 *   → Returns the created doctor's IDs + profile.
 *
 * RLS ensures you can only see doctors at clinics you belong to.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { withErrorHandler, ApiError } from "@/lib/error-handler"
import { logger } from "@/lib/logger"

// ─── Validation Schemas ───────────────────────────────────────────

/** Schema for GET query parameters */
const listSchema = z.object({
  clinic_id: z.string().uuid(),
})

/** Schema for POST body — all fields needed to create a new doctor */
const createSchema = z.object({
  clinic_id: z.string().uuid(),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  license_number: z.string().optional(),
  slot_duration: z.number().int().min(5).max(120).optional().default(30),
  fee: z.number().min(0).optional().default(0),
})

// ─── GET: List doctors at a clinic ───────────────────────────────

export const GET = withErrorHandler(async (request: NextRequest) => {
  // 1. Parse and validate query parameters
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const { clinic_id } = listSchema.parse(params)

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
    throw new ApiError(error.message, 500, "DB_ERROR")
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
      // Use doctors.id as the primary identifier — the UI navigates to /doctors/[id]
      id: doctor.id,                                   // doctors table UUID
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
})

// ─── POST: Create a new doctor ──────────────────────────────────

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 1. Parse and validate the request body
  const body = await request.json()
  const {
    clinic_id,
    email,
    password,
    first_name,
    last_name,
    phone,
    specialty,
    license_number,
    slot_duration,
    fee,
  } = createSchema.parse(body)

  // 2. Create the Supabase clients.
  //    - "supabase" = the regular client, authenticated as the CALLER (the admin).
  //      We use this to call create_doctor_at_clinic() — the function checks
  //      auth.uid() internally to verify the caller is an admin.
  //    - "adminClient" = the service_role client, with FULL ACCESS to Supabase.
  //      We use this ONLY to create the auth user, because auth.admin.createUser()
  //      requires the service_role key. Normal users can't create other users.
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // 3. Check if an auth user with this email already exists.
  //    If they do, the admin should use "Link existing doctor" instead.
  //    We check staff (not auth.users) because that's what we can query with RLS.
  const { data: existingStaff } = await adminClient
    .from("staff")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (existingStaff) {
    throw new ApiError(
      "A staff member with this email already exists. Use 'Link existing doctor' instead.",
      409,
      "EMAIL_EXISTS"
    )
  }

  // 4. Create the auth user via Supabase Admin API.
  //    auth.admin.createUser() uses the service_role key to create a user
  //    in auth.users without sending a confirmation email.
  //    email_confirm: true means the email is pre-verified (the admin is vouching
  //    for it). The doctor can log in immediately with this email + password.
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    // Common error: email already exists in auth.users but not in staff
    // (e.g. someone signed up directly but was never linked to a clinic)
    logger.error({ email, error: authError.message }, "Failed to create auth user")
    throw new ApiError(
      `Failed to create auth user: ${authError.message}`,
      400,
      "AUTH_ERROR"
    )
  }

  const authUserId = authData.user.id

  // 5. Call the atomic DB function to create staff + staff_clinics + doctors + settings.
  //    We use the REGULAR supabase client (not admin), so the function can read
  //    auth.uid() to verify the caller is an admin at this clinic.
  //    .rpc() calls a PostgreSQL function by name and passes parameters.
  const { data: result, error: rpcError } = await supabase.rpc(
    "create_doctor_at_clinic",
    {
      p_auth_user_id: authUserId,
      p_first_name: first_name,
      p_last_name: last_name,
      p_email: email,
      p_phone: phone,
      p_specialty: specialty,
      p_license_number: license_number,
      p_clinic_id: clinic_id,
      p_slot_duration: slot_duration,
      p_fee: fee,
    }
  )

  if (rpcError) {
    // ── Cleanup: delete the auth user since the DB function failed ──
    // Without this, we'd have an orphan auth user with no staff record.
    // They could log in but would see nothing (no clinic, no role).
    logger.error(
      { authUserId, error: rpcError.message },
      "create_doctor_at_clinic failed, cleaning up auth user"
    )

    await adminClient.auth.admin.deleteUser(authUserId)

    throw new ApiError(
      `Failed to create doctor: ${rpcError.message}`,
      500,
      "DB_ERROR"
    )
  }

  // 6. Return the created doctor info.
  //    The DB function returns a JSONB object with all the IDs.
  //    Supabase types it as generic `Json`, so we cast it to our known shape.
  //    This is safe because we control the SQL function's RETURN statement.
  const ids = result as unknown as {
    staff_id: string
    staff_clinic_id: string
    doctor_id: string
    settings_id: string
  }

  logger.info(
    { doctorId: ids.doctor_id, clinicId: clinic_id, email },
    "Doctor created successfully"
  )

  return NextResponse.json(
    {
      data: {
        doctor_id: ids.doctor_id,
        staff_id: ids.staff_id,
        settings_id: ids.settings_id,
        first_name,
        last_name,
        email,
        specialty: specialty ?? null,
        license_number: license_number ?? null,
      },
      message: "Doctor created successfully",
    },
    { status: 201 }
  )
})
