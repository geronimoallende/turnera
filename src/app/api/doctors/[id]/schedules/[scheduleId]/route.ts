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
import { withErrorHandler, ApiError } from "@/lib/error-handler"

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

export const PUT = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  const { id, scheduleId } = await context!.params

  const body = await request.json()
  const { clinic_id, ...updateData } = updateSchema.parse(body)

  if (Object.keys(updateData).length === 0) {
    throw new ApiError("No fields to update", 400, "VALIDATION_ERROR")
  }

  // Validate end_time > start_time if both are provided together.
  // If only one is provided, we'd need to fetch the current values to compare —
  // we skip that check here and rely on the DB constraint / schedule logic.
  if (updateData.start_time && updateData.end_time) {
    if (updateData.end_time <= updateData.start_time) {
      throw new ApiError("end_time must be after start_time", 400, "VALIDATION_ERROR")
    }
  }

  const supabase = await createClient()

  // Verify the caller has permission to update this doctor's schedule.
  const permission = await checkDoctorPermission(supabase, clinic_id, id)
  if (!permission.authorized) {
    throw new ApiError(permission.error, permission.status, "FORBIDDEN")
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
    throw new ApiError(updateError.message, 500, "INTERNAL_ERROR")
  }

  // Re-fetch the updated row to return the latest state
  const { data, error } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("id", scheduleId)
    .single()

  if (error) {
    throw new ApiError(error.message, 500, "INTERNAL_ERROR")
  }

  return NextResponse.json({ data })
})

// ─── DELETE: Delete a schedule block ─────────────────────────────

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  const { id, scheduleId } = await context!.params

  // clinic_id comes as a query param since DELETE requests have no body
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")
  if (!clinic_id) {
    throw new ApiError("clinic_id query parameter is required", 400, "VALIDATION_ERROR")
  }

  const supabase = await createClient()

  // Verify the caller has permission to delete this doctor's schedule block.
  const permission = await checkDoctorPermission(supabase, clinic_id, id)
  if (!permission.authorized) {
    throw new ApiError(permission.error, permission.status, "FORBIDDEN")
  }

  const { error } = await supabase
    .from("doctor_schedules")
    .delete()
    .eq("id", scheduleId)
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)

  if (error) {
    throw new ApiError(error.message, 500, "INTERNAL_ERROR")
  }

  return NextResponse.json(
    { message: "Schedule block deleted" },
    { status: 200 }
  )
})
