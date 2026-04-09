/**
 * Schedule Utilities — Compute a doctor's effective schedule for a specific date.
 *
 * Takes raw `doctor_schedules` rows (weekly recurring blocks) and
 * `schedule_overrides` rows (one-off exceptions) and computes the
 * doctor's actual working hours on a given date.
 *
 * Used by:
 *   - GET /api/doctors/schedules-for-date (batch endpoint for calendar)
 *   - POST /api/appointments (validation before creating appointment)
 */

// ─── Types ──────────────────────────────────────────────────────

/** A time range where the doctor is available */
export type TimeBlock = {
  start_time: string // "HH:MM" format
  end_time: string   // "HH:MM" format
}

/** The computed result: what hours does this doctor work on this specific date? */
export type EffectiveSchedule = {
  blocks: TimeBlock[]
  is_blocked: boolean
  block_reason: string | null
}

/** Shape of a row from the doctor_schedules table (only fields we need) */
export type ScheduleRow = {
  start_time: string
  end_time: string
  is_active: boolean
}

/** Shape of a row from the schedule_overrides table (only fields we need) */
export type OverrideRow = {
  override_type: "block" | "available"
  start_time: string | null
  end_time: string | null
  reason: string | null
}

// ─── Helpers ────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/**
 * Subtract a time range from a list of blocks.
 *
 * Example: blocks = [{08:00-17:00}], remove = {12:00-13:00}
 * Result: [{08:00-12:00}, {13:00-17:00}]
 */
function subtractRange(
  blocks: TimeBlock[],
  removeStart: number,
  removeEnd: number
): TimeBlock[] {
  const result: TimeBlock[] = []

  for (const block of blocks) {
    const blockStart = timeToMinutes(block.start_time)
    const blockEnd = timeToMinutes(block.end_time)

    // No overlap
    if (blockEnd <= removeStart || blockStart >= removeEnd) {
      result.push(block)
      continue
    }

    // Part before the removed range
    if (blockStart < removeStart) {
      result.push({
        start_time: block.start_time,
        end_time: minutesToTime(removeStart),
      })
    }

    // Part after the removed range
    if (blockEnd > removeEnd) {
      result.push({
        start_time: minutesToTime(removeEnd),
        end_time: block.end_time,
      })
    }
  }

  return result
}

// ─── Main function ──────────────────────────────────────────────

/**
 * Compute a doctor's effective schedule for a specific date.
 *
 * @param scheduleRows - Weekly recurring blocks (already filtered by day_of_week)
 * @param overrideRows - Override rows (already filtered by override_date)
 */
export function computeEffectiveSchedule(
  scheduleRows: ScheduleRow[],
  overrideRows: OverrideRow[]
): EffectiveSchedule {
  // Step 1: Start with active schedule blocks
  let blocks: TimeBlock[] = scheduleRows
    .filter((row) => row.is_active)
    .map((row) => ({
      start_time: row.start_time,
      end_time: row.end_time,
    }))

  // Step 2: Apply block overrides
  let is_blocked = false
  let block_reason: string | null = null

  for (const override of overrideRows) {
    if (override.override_type === "block") {
      if (override.start_time === null || override.end_time === null) {
        // Full-day block (vacation, sick day)
        blocks = []
        is_blocked = true
        block_reason = override.reason
      } else {
        // Partial block (meeting 12-14, leaves early, etc.)
        blocks = subtractRange(
          blocks,
          timeToMinutes(override.start_time),
          timeToMinutes(override.end_time)
        )
      }
    }
  }

  // Step 3: Apply available overrides (extra hours, changed schedule)
  for (const override of overrideRows) {
    if (override.override_type === "available") {
      if (override.start_time !== null && override.end_time !== null) {
        blocks.push({
          start_time: override.start_time,
          end_time: override.end_time,
        })
        // Available override undoes a full-day block
        if (is_blocked) {
          is_blocked = false
          block_reason = null
        }
      }
    }
  }

  // Step 4: Sort by start time
  blocks.sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))

  return { blocks, is_blocked, block_reason }
}

// ─── Validation helper ──────────────────────────────────────────

/**
 * Check if a time range falls entirely within any schedule block.
 * Used by appointment creation to validate the time is within working hours.
 */
export function isTimeWithinSchedule(
  startTime: string,
  endTime: string,
  blocks: TimeBlock[]
): boolean {
  const aptStart = timeToMinutes(startTime)
  const aptEnd = timeToMinutes(endTime)

  return blocks.some((block) => {
    const blockStart = timeToMinutes(block.start_time)
    const blockEnd = timeToMinutes(block.end_time)
    return aptStart >= blockStart && aptEnd <= blockEnd
  })
}
