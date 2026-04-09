/**
 * API Route: /api/doctors/schedules-for-date
 *
 * GET /api/doctors/schedules-for-date?clinic_id=xxx&date=2026-04-06
 *   → Returns the effective schedule for ALL doctors at a clinic on a given date.
 *   → Combines doctor_schedules (weekly recurring) with schedule_overrides (one-off).
 *   → Used by the calendar to show businessHours per doctor column.
 *
 * Why a batch endpoint instead of N calls to /doctors/[id]/schedules?
 *   - 1 request for all doctors (vs N requests)
 *   - Returns computed effective schedule (vs raw data the client must process)
 *   - Reusable by Python AI backend / WhatsApp bot
 *
 * Response: { data: Record<doctorId, EffectiveSchedule> }
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"
import {
  computeEffectiveSchedule,
  type EffectiveSchedule,
  type ScheduleRow,
  type OverrideRow,
} from "@/lib/schedule-utils"

const querySchema = z.object({
  clinic_id: z.uuidv4(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const { clinic_id, date } = querySchema.parse(params)

  const supabase = await createClient()

  // Step 1: Get all active doctor IDs at this clinic
  const { data: doctorSettings, error: settingsError } = await supabase
    .from("doctor_clinic_settings")
    .select("doctor_id")
    .eq("clinic_id", clinic_id)
    .eq("is_active", true)

  if (settingsError) throw new ApiError(settingsError.message, 500, "DB_ERROR")

  const doctorIds = doctorSettings?.map((s) => s.doctor_id) ?? []
  if (doctorIds.length === 0) {
    return NextResponse.json({ data: {} })
  }

  // Step 2: Compute day_of_week (0=Sun, 6=Sat)
  // T12:00:00 avoids timezone edge cases where midnight could shift the day
  const dayOfWeek = new Date(date + "T12:00:00").getUTCDay()

  // Step 3: Fetch schedules for all doctors on this day (2 queries, not N)
  const { data: schedules, error: schedulesError } = await supabase
    .from("doctor_schedules")
    .select("doctor_id, start_time, end_time, is_active")
    .in("doctor_id", doctorIds)
    .eq("clinic_id", clinic_id)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .lte("valid_from", date)
    .or(`valid_until.is.null,valid_until.gte.${date}`)

  if (schedulesError) throw new ApiError(schedulesError.message, 500, "DB_ERROR")

  // Step 4: Fetch overrides for all doctors on this exact date
  const { data: overrides, error: overridesError } = await supabase
    .from("schedule_overrides")
    .select("doctor_id, override_type, start_time, end_time, reason")
    .in("doctor_id", doctorIds)
    .eq("clinic_id", clinic_id)
    .eq("override_date", date)

  if (overridesError) throw new ApiError(overridesError.message, 500, "DB_ERROR")

  // Step 5: Group by doctor and compute effective schedule
  const result: Record<string, EffectiveSchedule> = {}

  for (const doctorId of doctorIds) {
    const doctorSchedules: ScheduleRow[] = (schedules ?? [])
      .filter((s) => s.doctor_id === doctorId)
      .map((s) => ({
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active ?? true, // is_active can be null in DB
      }))

    const doctorOverrides: OverrideRow[] = (overrides ?? [])
      .filter((o) => o.doctor_id === doctorId)
      .map((o) => ({
        override_type: o.override_type as "block" | "available",
        start_time: o.start_time,
        end_time: o.end_time,
        reason: o.reason,
      }))

    result[doctorId] = computeEffectiveSchedule(doctorSchedules, doctorOverrides)
  }

  return NextResponse.json({ data: result })
})
