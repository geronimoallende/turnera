/**
 * check-doctor-permission.ts
 *
 * Shared authorization helper for doctor mutation API routes.
 *
 * Rules:
 * - Admin → always authorized.
 * - Doctor → authorized only for their own doctor record (matched via staff_id).
 * - Secretary and any other role → never authorized for mutations.
 *
 * Usage:
 *   const permission = await checkDoctorPermission(supabase, clinic_id, doctorId)
 *   if (!permission.authorized) {
 *     return NextResponse.json({ error: permission.error }, { status: permission.status })
 *   }
 *
 * Pass adminOnly = true for endpoints that should reject even the owning doctor
 * (e.g., clinic-level settings that only an admin should configure).
 */

import { SupabaseClient } from "@supabase/supabase-js"

type PermissionResult =
  | { authorized: true }
  | { authorized: false; status: number; error: string }

/**
 * Checks if the current user can perform mutations on a specific doctor's data.
 *
 * @param supabase   - Server-side Supabase client (carries the user's JWT).
 * @param clinicId   - The clinic context (used to look up the user's role).
 * @param doctorId   - The doctor record being modified.
 * @param adminOnly  - When true, only admins are allowed (e.g., clinic settings).
 */
export async function checkDoctorPermission(
  supabase: SupabaseClient,
  clinicId: string,
  doctorId: string,
  adminOnly = false
): Promise<PermissionResult> {
  // 1. Resolve the user's role at this clinic via the existing DB function.
  //    The function returns 'admin' | 'doctor' | 'secretary' | null.
  const { data: role, error: roleError } = await supabase.rpc("get_user_role", {
    p_clinic_id: clinicId,
  })

  if (roleError || !role) {
    return { authorized: false, status: 403, error: "Not authorized for this clinic" }
  }

  // 2. Admin can always perform any mutation.
  if (role === "admin") {
    return { authorized: true }
  }

  // 3. For admin-only endpoints (e.g., doctor_clinic_settings), reject everyone else.
  if (adminOnly) {
    return { authorized: false, status: 403, error: "Only admin can perform this action" }
  }

  // 4. A doctor can modify only their own records.
  if (role === "doctor") {
    // Identify the currently authenticated user.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { authorized: false, status: 401, error: "Not authenticated" }
    }

    // Find the staff row linked to this auth user.
    // `staff.auth_user_id` holds the Supabase auth UUID.
    const { data: staff } = await supabase
      .from("staff")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (!staff) {
      return { authorized: false, status: 403, error: "Staff record not found" }
    }

    // Check whether the target doctor record belongs to this staff member.
    // `doctors.staff_id` is the link between the two tables.
    const { data: doctor } = await supabase
      .from("doctors")
      .select("staff_id")
      .eq("id", doctorId)
      .single()

    if (doctor?.staff_id === staff.id) {
      return { authorized: true }
    }

    return {
      authorized: false,
      status: 403,
      error: "Can only modify your own doctor record",
    }
  }

  // 5. Secretary and all other roles — no mutation access.
  return { authorized: false, status: 403, error: "Not authorized for this action" }
}
