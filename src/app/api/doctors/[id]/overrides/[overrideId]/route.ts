/**
 * API Route: /api/doctors/[id]/overrides/[overrideId]
 *
 * DELETE /api/doctors/[id]/overrides/[overrideId]?clinic_id=xxx
 *   → Deletes a single schedule override.
 *   → clinic_id is passed as a query param (no body on DELETE requests).
 *   → Filters by id + doctor_id + clinic_id to prevent cross-tenant deletions.
 *
 * [id] = doctors.id, [overrideId] = schedule_overrides.id
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkDoctorPermission } from "@/lib/auth/check-doctor-permission"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

// ─── DELETE: Delete an override ───────────────────────────────────

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  const { id, overrideId } = await context!.params

  // clinic_id comes as a query param since DELETE requests have no body
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")
  if (!clinic_id) {
    throw new ApiError("clinic_id query parameter is required", 400, "VALIDATION_ERROR")
  }

  const supabase = await createClient()

  // Verify the caller has permission to delete this doctor's override.
  const permission = await checkDoctorPermission(supabase, clinic_id, id)
  if (!permission.authorized) {
    throw new ApiError(permission.error, permission.status, "FORBIDDEN")
  }

  const { error } = await supabase
    .from("schedule_overrides")
    .delete()
    .eq("id", overrideId)
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)

  if (error) {
    throw new ApiError(error.message, 500, "INTERNAL_ERROR")
  }

  return NextResponse.json(
    { message: "Override deleted" },
    { status: 200 }
  )
})
