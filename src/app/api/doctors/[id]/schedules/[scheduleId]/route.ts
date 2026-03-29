/**
 * API Route: /api/doctors/[id]/schedules/[scheduleId]
 *
 * Handles updating and deleting a specific weekly schedule block.
 *
 * PUT /api/doctors/[id]/schedules/[scheduleId]
 *   → Updates an existing schedule block (time range, slot duration, etc.)
 *   → Validates end_time > start_time if both are provided in the update.
 *
 * DELETE /api/doctors/[id]/schedules/[scheduleId]?clinic_id=xxx
 *   → Deletes the schedule block.
 *   → clinic_id is passed as a query param (no body on DELETE requests).
 *   → Filters by doctor_id + clinic_id to prevent cross-tenant deletions.
 *
 * [id] = doctors.id, [scheduleId] = doctor_schedules.id
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { checkDoctorPermission } from "@/lib/auth/check-doctor-permission"

// ─── Validation Schemas ───────────────────────────────────────────

const timeRegex = /^\d{2}:\d{2}$/

const updateSchema = z.object({
  clinic_id: z.uuid(),
  day_of_week: z.number().int().min(0).max(6).optional(),
  start_time: z.string().regex(timeRegex, "Must be HH:MM format").optional(),
  end_time: z.string().regex(timeRegex, "Must be HH:MM format").optional(),
  slot_duration_minutes: z.number().int().min(5).max(120).optional(),
  is_active: z.boolean().optional(),
  valid_from: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
})

// ─── PUT: Update a schedule block ────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { id, scheduleId } = await params

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 }
    )
  }

  const { clinic_id, ...updateData } = parsed.data

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    )
  }

  // Validate end_time > start_time if both are provided together.
  // If only one is provided, we'd need to fetch the current values to compare —
  // we skip that check here and rely on the DB constraint / schedule logic.
  if (updateData.start_time && updateData.end_time) {
    if (updateData.end_time <= updateData.start_time) {
      return NextResponse.json(
        { error: "end_time must be after start_time" },
        { status: 400 }
      )
    }
  }

  const supabase = await createClient()

  // Verify the caller has permission to update this doctor's schedule.
  const permission = await checkDoctorPermission(supabase, clinic_id, id)
  if (!permission.authorized) {
    return NextResponse.json({ error: permission.error }, { status: permission.status })
  }

  // Update the row, filtering by scheduleId + doctor_id + clinic_id for safety.
  // This prevents updating a schedule block that doesn't belong to this doctor/clinic.
  const { error: updateError } = await supabase
    .from("doctor_schedules")
    .update(updateData)
    .eq("id", scheduleId)
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Re-fetch the updated row to return the latest state
  const { data, error } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("id", scheduleId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// ─── DELETE: Delete a schedule block ─────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { id, scheduleId } = await params

  // clinic_id comes as a query param since DELETE requests have no body
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")
  if (!clinic_id) {
    return NextResponse.json(
      { error: "clinic_id query parameter is required" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Verify the caller has permission to delete this doctor's schedule block.
  const permission = await checkDoctorPermission(supabase, clinic_id, id)
  if (!permission.authorized) {
    return NextResponse.json({ error: permission.error }, { status: permission.status })
  }

  const { error } = await supabase
    .from("doctor_schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { message: "Schedule block deleted" },
    { status: 200 }
  )
}
