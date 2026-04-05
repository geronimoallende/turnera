/**
 * API Route: /api/appointments/queue
 *
 * GET /api/appointments/queue?clinic_id=xxx&doctor_id=yyy
 *   → Returns today's appointments for a specific doctor, grouped by status
 *   → Used by the doctor's "waiting room" view
 *
 * Response structure:
 *   {
 *     in_progress: appointment | null    ← patient currently being seen
 *     waiting: appointment[]             ← patients who arrived, waiting their turn
 *     upcoming: appointment[]            ← confirmed but haven't arrived yet
 *     completed: number                  ← count of finished consultations
 *     no_shows: number                   ← count of patients who didn't show up
 *   }
 *
 * The waiting list is sorted by checked_in_at (who arrived first gets seen first).
 * The upcoming list is sorted by start_time (appointment order).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

const queueSchema = z.object({
  clinic_id: z.uuidv4(),
  doctor_id: z.uuidv4(),
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const { clinic_id, doctor_id } = queueSchema.parse(params)

  const supabase = await createClient()

  // Get today's date in YYYY-MM-DD format
  // This ensures we only show today's appointments, not past or future
  const today = new Date().toISOString().split("T")[0]

  // Fetch ALL of today's appointments for this doctor at this clinic
  // We'll group them in JavaScript below
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id, appointment_date, start_time, end_time, duration_minutes,
      status, reason, checked_in_at, started_at, completed_at,
      clinic_patients!inner(id, first_name, last_name, dni, phone,
        insurance_provider, insurance_plan, no_show_count)
    `)
    .eq("clinic_id", clinic_id)
    .eq("doctor_id", doctor_id)
    .eq("appointment_date", today)
    .order("start_time")

  if (error) throw new ApiError(error.message, 500, "DB_ERROR")

  // Group appointments by status
  // .find() returns the first match (there should only be one in_progress at a time)
  // .filter() returns all matches as an array
  const in_progress = appointments?.find((a) => a.status === "in_progress") || null

  // Waiting = arrived patients, sorted by who arrived first (checked_in_at)
  const waiting =
    appointments
      ?.filter((a) => a.status === "arrived")
      .sort(
        (a, b) =>
          new Date(a.checked_in_at!).getTime() - new Date(b.checked_in_at!).getTime()
      ) || []

  // Upcoming = confirmed patients who haven't arrived yet
  const upcoming = appointments?.filter((a) => a.status === "confirmed") || []

  // Count completed and no-shows (just numbers, not full objects)
  const completed = appointments?.filter((a) => a.status === "completed").length || 0
  const no_shows = appointments?.filter((a) => a.status === "no_show").length || 0

  return NextResponse.json({ in_progress, waiting, upcoming, completed, no_shows })
})
