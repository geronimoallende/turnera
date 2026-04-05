/**
 * MonthView — FullCalendar month grid with appointment counts per day.
 *
 * Unlike day/week views, the month view does NOT show individual
 * appointment blocks (they'd be too small to read). Instead, it shows
 * aggregate badges per day:
 *   "12 appointments"  (blue)
 *   "3 pending"        (yellow)
 *   "1 no-show"        (red)
 *
 * Clicking a day cell switches to the day view for that date.
 */

"use client"

import { useMemo, useCallback } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { DayCellContentArg } from "@fullcalendar/core"
import { format } from "date-fns"
import type { AppointmentListItem } from "@/lib/hooks/use-appointments"

type MonthViewProps = {
  date: Date
  appointments: AppointmentListItem[]
  onDayClick: (date: Date) => void
}

export function MonthView({ date, appointments, onDayClick }: MonthViewProps) {
  // Group appointments by date to count them per day
  // Result: Map<"2026-04-04", { total: 12, pending: 3, noShows: 1 }>
  const countsByDate = useMemo(() => {
    const map = new Map<
      string,
      { total: number; pending: number; noShows: number }
    >()

    for (const apt of appointments) {
      const dateKey = apt.appointment_date
      const current = map.get(dateKey) || { total: 0, pending: 0, noShows: 0 }

      current.total++
      if (apt.status === "otorgado") current.pending++
      if (apt.status === "no_show") current.noShows++

      map.set(dateKey, current)
    }

    return map
  }, [appointments])

  // Convert to FullCalendar events — one "event" per day that has appointments
  // These are shown as badges in the day cells
  const events = useMemo(() => {
    const result: Array<{
      start: string
      display: string
      extendedProps: { total: number; pending: number; noShows: number }
    }> = []

    countsByDate.forEach((counts, dateKey) => {
      result.push({
        start: dateKey,
        display: "background", // Render as background, not a block
        extendedProps: counts,
      })
    })

    return result
  }, [countsByDate])

  // When user clicks a day cell, switch to day view
  const handleDateClick = useCallback(
    (info: { date: Date }) => {
      onDayClick(info.date)
    },
    [onDayClick]
  )

  // Custom cell renderer — shows appointment count badges
  const renderDayCellContent = useCallback(
    (info: DayCellContentArg) => {
      const dateKey = format(info.date, "yyyy-MM-dd")
      const counts = countsByDate.get(dateKey)

      return (
        <div className="p-1">
          <div className="mb-1 text-[11px]">{info.dayNumberText}</div>
          {counts && (
            <div className="flex flex-col gap-0.5">
              {/* Total appointments badge (blue) */}
              <div className="rounded bg-blue-50 px-1 py-0.5 text-[9px] text-blue-600">
                {counts.total} appt{counts.total !== 1 ? "s" : ""}
              </div>
              {/* Pending badge (yellow) — only if there are pending ones */}
              {counts.pending > 0 && (
                <div className="rounded bg-amber-50 px-1 py-0.5 text-[9px] text-amber-600">
                  {counts.pending} pending
                </div>
              )}
              {/* No-show badge (red) — only if there are no-shows */}
              {counts.noShows > 0 && (
                <div className="rounded bg-red-50 px-1 py-0.5 text-[9px] text-red-600">
                  {counts.noShows} no-show{counts.noShows !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    [countsByDate]
  )

  return (
    <div className="h-full">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={date}
        headerToolbar={false}
        firstDay={1}
        height="100%"
        dateClick={handleDateClick}
        dayCellContent={renderDayCellContent}
        events={events}
      />
    </div>
  )
}
