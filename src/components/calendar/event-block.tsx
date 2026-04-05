/**
 * EventBlock — Custom renderer for appointment blocks inside FullCalendar.
 *
 * FullCalendar renders each appointment as a colored block in the time grid.
 * By default it just shows the event title. We override this with `eventContent`
 * to show richer info: time, duration, patient name, consultation type,
 * and visual indicators for status (border color, strikethrough, opacity).
 *
 * This component is NOT rendered directly — it's called by FullCalendar's
 * `eventContent` callback prop, which passes the event data.
 *
 * Visual design:
 *   ┌──────────────────────┐
 *   │ 09:30  30m           │  ← time + duration
 *   │ Maria Garcia         │  ← patient name (bold)
 *   │ Checkup         OB   │  ← reason + overbooking badge
 *   └──────────────────────┘
 *   Left border: 4px colored by status (blue=confirmed, green=arrived, etc.)
 */

import {
  APPOINTMENT_STATUS_COLORS,
  FADED_STATUSES,
} from "@/lib/constants/appointment-status"

type EventBlockProps = {
  // FullCalendar passes the event info through this object
  event: {
    start: Date | null
    end: Date | null
    extendedProps: {
      patientName: string
      status: string
      reason: string | null
      isOverbooking: boolean
      duration: number
    }
  }
  // In week view, we show less info because the blocks are smaller
  compact?: boolean
}

export function EventBlock({ event, compact = false }: EventBlockProps) {
  // Safely read extendedProps — FullCalendar may pass them differently
  // depending on how the event was created
  const props = event.extendedProps || {}
  const patientName = props.patientName || "Unknown"
  const status = props.status || "confirmed"
  const reason = props.reason || null
  const isOverbooking = props.isOverbooking || false
  const duration = props.duration || 30

  // Get the border color for this status from our constants
  const borderColor = APPOINTMENT_STATUS_COLORS[status] || "#3b82f6"

  // Should this block look faded? (completed, no_show, cancelled, rescheduled)
  const isFaded = FADED_STATUSES.includes(status)

  // Should the patient name have a strikethrough line? (no_show, cancelled)
  const isStrikethrough =
    status === "no_show" || status.startsWith("cancelled") || status === "rescheduled"

  // Format start time: Date object → "09:30"
  const timeStr = event.start
    ? event.start.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : ""

  // In compact mode (week view), only show time + last name
  if (compact) {
    // Extract last name: "Maria Garcia" → "Garcia"
    const lastName = patientName.split(" ").slice(-1)[0]
    return (
      <div
        className="h-full w-full overflow-hidden px-1 py-0.5"
        style={{
          borderLeft: `3px solid ${borderColor}`,
          opacity: isFaded ? 0.6 : 1,
        }}
      >
        <div className="text-[9px] font-bold">{timeStr}</div>
        <div
          className="truncate text-[9px] font-semibold"
          style={{
            textDecoration: isStrikethrough ? "line-through" : "none",
            color: isStrikethrough ? "#94a3b8" : "inherit",
          }}
        >
          {lastName}
        </div>
      </div>
    )
  }

  // Full mode (day view) — show all info
  return (
    <div
      className="h-full w-full overflow-hidden px-1.5 py-1"
      style={{
        borderLeft: `4px solid ${borderColor}`,
        opacity: isFaded ? 0.6 : 1,
      }}
    >
      {/* Row 1: Time + Duration */}
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-bold">{timeStr}</span>
        <span className="text-[10px] text-gray-400">{duration}m</span>
      </div>

      {/* Row 2: Patient name */}
      <div
        className="truncate text-[11px] font-semibold"
        style={{
          textDecoration: isStrikethrough ? "line-through" : "none",
          color: isStrikethrough ? "#94a3b8" : "inherit",
        }}
      >
        {patientName}
      </div>

      {/* Row 3: Reason + OB badge */}
      <div className="flex items-center gap-1">
        {reason && (
          <span className="truncate text-[10px] text-gray-400">{reason}</span>
        )}
        {isOverbooking && (
          <span className="shrink-0 rounded bg-amber-500 px-1 text-[7px] font-bold text-white">
            OB
          </span>
        )}
      </div>
    </div>
  )
}
