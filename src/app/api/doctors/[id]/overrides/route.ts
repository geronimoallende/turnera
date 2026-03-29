/**
 * API Route: /api/doctors/[id]/overrides
 *
 * Manages one-off schedule exceptions (vacations, sick days, extra hours).
 * Unlike recurring `doctor_schedules`, each override applies to a single date.
 *
 * Override types:
 * - "block"     → doctor is NOT available on this date (or specific time range)
 * - "available" → doctor IS available on this date (overrides their usual day off)
 *
 * GET /api/doctors/[id]/overrides?clinic_id=xxx
 *   → Returns upcoming overrides (today and future), ordered by date ascending.
 *   → Past overrides are excluded — no need to display expired exceptions.
 *
 * POST /api/doctors/[id]/overrides
 *   → Creates a new override.
 *   → Validates the date is today or in the future (can't override the past).
 *   → Validates the date is within the clinic's booking window (max_booking_days_ahead).
 *   → Validates end_time > start_time if a time range is provided.
 *
 * [id] = doctors.id
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// ─── Validation Schemas ───────────────────────────────────────────

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^\d{2}:\d{2}$/

const listSchema = z.object({
  clinic_id: z.uuid(),
})

const createSchema = z.object({
  clinic_id: z.uuid(),
  override_date: z.string().regex(dateRegex, "Must be YYYY-MM-DD format"),
  override_type: z.enum(["block", "available"]),
  start_time: z.string().regex(timeRegex, "Must be HH:MM format").nullable().optional(),
  end_time: z.string().regex(timeRegex, "Must be HH:MM format").nullable().optional(),
  reason: z.string().nullable().optional(),
})

// ─── GET: List upcoming overrides ────────────────────────────────

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

  // Get today's date as YYYY-MM-DD string (in UTC — safe for date comparisons)
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("schedule_overrides")
    .select("*")
    .eq("doctor_id", id)
    .eq("clinic_id", clinic_id)
    .gte("override_date", today) // only upcoming overrides
    .order("override_date", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// ─── POST: Create an override ─────────────────────────────────────

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
    override_date,
    override_type,
    start_time,
    end_time,
    reason,
  } = parsed.data

  // 1. Validate date is today or in the future (can't modify the past)
  const today = new Date().toISOString().split("T")[0]
  if (override_date < today) {
    return NextResponse.json(
      { error: "override_date cannot be in the past" },
      { status: 400 }
    )
  }

  // 2. Validate end_time > start_time if a partial time range is provided
  if (start_time && end_time && end_time <= start_time) {
    return NextResponse.json(
      { error: "end_time must be after start_time" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // 3. Validate date is within the clinic's booking window.
  //    Clinics configure how far ahead appointments can be booked
  //    (e.g., 60 days). Overrides beyond that window serve no purpose.
  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .select("max_booking_days_ahead")
    .eq("id", clinic_id)
    .single()

  if (clinicError || !clinic) {
    return NextResponse.json(
      { error: "Clinic not found" },
      { status: 404 }
    )
  }

  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + clinic.max_booking_days_ahead)
  const maxDateStr = maxDate.toISOString().split("T")[0]

  if (override_date > maxDateStr) {
    return NextResponse.json(
      {
        error: `override_date cannot be more than ${clinic.max_booking_days_ahead} days ahead`,
      },
      { status: 400 }
    )
  }

  // 4. Insert the override
  const { data, error } = await supabase
    .from("schedule_overrides")
    .insert({
      doctor_id: id,
      clinic_id,
      override_date,
      override_type,
      start_time: start_time ?? null,
      end_time: end_time ?? null,
      reason: reason ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
