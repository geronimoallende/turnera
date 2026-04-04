/**
 * API Route: /api/doctors/lookup
 *
 * POST /api/doctors/lookup { email, clinic_id }
 *   → Searches for an existing doctor by email.
 *   → Returns PARTIAL info only (masked name + specialty) for privacy.
 *   → Used by the "Add Doctor → Existing Doctor" flow: the admin types
 *     an email, we show them just enough to confirm it's the right person,
 *     then they click "Link" to add them to their clinic.
 *
 * WHY POST instead of GET?
 *   Email is sensitive data. GET requests put params in the URL, which
 *   gets logged in server access logs, browser history, and Vercel logs.
 *   POST puts it in the body, which is not logged by default.
 *
 * WHY partial info?
 *   An admin at Clinic A shouldn't see the full name of a doctor at Clinic B
 *   just by guessing emails. We return "Dr. G***a - Cardiología" — enough
 *   to confirm identity without leaking personal data.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

// ─── Validation Schema ───────────────────────────────────────────

const lookupSchema = z.object({
  email: z.string().email("Valid email is required"),
  clinic_id: z.uuid(),
})

// ─── Helper: Mask a name for privacy ─────────────────────────────
//
// "García" → "G***a"  (show first and last letter, mask the rest)
// "Li"     → "L*"     (too short for last letter)
// "A"      → "A"      (single letter, nothing to mask)

function maskName(name: string): string {
  if (name.length <= 2) return name[0] + "*"
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1]
}

// ─── POST: Look up a doctor by email ─────────────────────────────

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { email, clinic_id } = lookupSchema.parse(body)

  const supabase = await createClient()

  // 1. Verify the caller belongs to the target clinic.
  //    We use get_user_role via RPC — if it returns null, they don't belong.
  const { data: role } = await supabase.rpc("get_user_role", {
    p_clinic_id: clinic_id,
  })

  if (role !== "admin") {
    throw new ApiError("Only admins can look up doctors", 403, "FORBIDDEN")
  }

  // 2. Search for a staff member with this email who is also a doctor.
  //    We query staff → doctors join. If the email exists in staff but
  //    they're not a doctor (e.g. they're a secretary), we don't return them.
  const { data: staffData, error: staffError } = await supabase
    .from("staff")
    .select(`
      id,
      first_name,
      last_name,
      email,
      doctors!inner (
        id,
        specialty
      )
    `)
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle()

  if (staffError) {
    throw new ApiError(staffError.message, 500, "DB_ERROR")
  }

  if (!staffData) {
    throw new ApiError("No doctor found with this email", 404, "NOT_FOUND")
  }

  // 3. Check if this doctor is already linked to the caller's clinic.
  const doctor = staffData.doctors as { id: string; specialty: string | null }

  const { data: existingLink } = await supabase
    .from("doctor_clinic_settings")
    .select("id")
    .eq("doctor_id", doctor.id)
    .eq("clinic_id", clinic_id)
    .maybeSingle()

  // 4. Return partial info — masked name + specialty + already_linked flag.
  return NextResponse.json({
    data: {
      doctor_id: doctor.id,
      display_name: `Dr. ${maskName(staffData.last_name)}`,
      specialty: doctor.specialty,
      already_linked: existingLink !== null,
    },
  })
})
