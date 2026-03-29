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

// ─── DELETE: Delete an override ───────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; overrideId: string }> }
) {
  const { id, overrideId } = await params

  // clinic_id comes as a query param since DELETE requests have no body
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")
  if (!clinic_id) {
    return NextResponse.json(
      { error: "clinic_id query parameter is required" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("schedule_overrides")
    .delete()
    .eq("id", overrideId)
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { message: "Override deleted" },
    { status: 200 }
  )
}
