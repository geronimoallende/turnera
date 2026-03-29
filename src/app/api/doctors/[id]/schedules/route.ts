/**
 * API Route: /api/doctors/[id]/schedules
 *
 * Manages recurring weekly schedule blocks for a doctor.
 * Each block represents "this doctor is available on day X from HH:MM to HH:MM".
 *
 * GET /api/doctors/[id]/schedules?clinic_id=xxx
 *   → Returns all schedule blocks for this doctor at this clinic.
 *   → Ordered by day_of_week (0=Sunday, 6=Saturday), then start_time.
 *
 * POST /api/doctors/[id]/schedules
 *   → Creates a new weekly schedule block.
 *   → Validates that end_time > start_time.
 *   → Checks for overlapping blocks on the same day (prevents double-booking).
 *   → If slot_duration_minutes is not provided, falls back to the doctor's
 *     default from doctor_clinic_settings.
 *
 * The [id] is the `doctors.id` UUID.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// ─── Validation Schemas ───────────────────────────────────────────

/** HH:MM format regex — e.g., "09:00", "17:30" */
const timeRegex = /^\d{2}:\d{2}$/

const listSchema = z.object({
  clinic_id: z.uuid(),
})

const createSchema = z.object({
  clinic_id: z.uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(timeRegex, "Must be HH:MM format"),
  end_time: z.string().regex(timeRegex, "Must be HH:MM format"),
  slot_duration_minutes: z.number().int().min(5).max(120).optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().nullable().optional(),
})

// ─── GET: List schedule blocks ────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const rawParams = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = listSchema.safeParse(rawParams)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 }
    )
  }

  const { clinic_id } = parsed.data

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("doctor_schedules")
    .select("*")
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// ─── POST: Create a schedule block ───────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const body = await request.json()
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 }
    )
  }

  const {
    clinic_id,
    day_of_week,
    start_time,
    end_time,
    slot_duration_minutes,
    valid_from,
    valid_until,
  } = parsed.data

  // 1. Validate that end_time comes after start_time.
  //    We compare as strings — "09:00" < "17:30" works lexicographically for HH:MM.
  if (end_time <= start_time) {
    return NextResponse.json(
      { error: "end_time must be after start_time" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // 2. Check for overlapping schedule blocks on the same day.
  //    Two blocks overlap if one starts before the other ends.
  //    Overlap condition: existing.start_time < new.end_time AND existing.end_time > new.start_time
  const { data: overlapping, error: overlapError } = await supabase
    .from("doctor_schedules")
    .select("id, start_time, end_time")
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)
    .eq("day_of_week", day_of_week)
    .eq("is_active", true)
    .lt("start_time", end_time)   // existing block starts before new block ends
    .gt("end_time", start_time)   // existing block ends after new block starts

  if (overlapError) {
    return NextResponse.json({ error: overlapError.message }, { status: 500 })
  }

  if (overlapping && overlapping.length > 0) {
    return NextResponse.json(
      {
        error: "Schedule block overlaps with an existing block on this day",
        conflicts: overlapping,
      },
      { status: 409 }
    )
  }

  // 3. Resolve slot duration — use provided value or fall back to doctor's default
  let resolvedSlotDuration = slot_duration_minutes

  if (resolvedSlotDuration === undefined) {
    const { data: settings } = await supabase
      .from("doctor_clinic_settings")
      .select("default_slot_duration_minutes")
      .eq("doctor_id", id)
      .eq("clinic_id", clinic_id)
      .maybeSingle()

    // Default to 30 minutes if no settings row exists yet
    resolvedSlotDuration = settings?.default_slot_duration_minutes ?? 30
  }

  // 4. Insert the new schedule block
  const { data, error } = await supabase
    .from("doctor_schedules")
    .insert({
      doctor_id: id,
      clinic_id,
      day_of_week,
      start_time,
      end_time,
      slot_duration_minutes: resolvedSlotDuration,
      valid_from: valid_from ?? null,
      valid_until: valid_until ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
