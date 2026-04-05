/**
 * CalendarHeader — Top bar of the calendar page.
 *
 * Contains:
 *   - Navigation arrows (‹ ›) + date display + "Today" button
 *   - View toggle (Day | Week | Month)
 *   - Doctor selector dropdown (only in week view)
 *   - "+ New appointment" button (admin/secretary only)
 *
 * The date display changes based on the current view:
 *   Day:   "Friday, April 4, 2026"
 *   Week:  "Mar 30 — Apr 5, 2026"
 *   Month: "April 2026"
 */

"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  format,
  startOfWeek,
  endOfWeek,
} from "date-fns"

type CalendarHeaderProps = {
  currentDate: Date
  view: "day" | "week" | "month"
  onDateChange: (date: Date) => void
  onViewChange: (view: "day" | "week" | "month") => void
  onNewAppointment: () => void
  // Week view shows a dropdown to pick which doctor
  selectedDoctorId?: string
  onDoctorChange?: (doctorId: string) => void
  doctors?: Array<{ id: string; first_name: string; last_name: string }>
  role: string | null
}

export function CalendarHeader({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onNewAppointment,
  selectedDoctorId,
  onDoctorChange,
  doctors = [],
  role,
}: CalendarHeaderProps) {
  // ── Navigation: what "previous" and "next" mean depends on the view ──
  // Day view: prev/next = yesterday/tomorrow
  // Week view: prev/next = last week/next week
  // Month view: prev/next = last month/next month
  function goBack() {
    if (view === "day") onDateChange(subDays(currentDate, 1))
    else if (view === "week") onDateChange(subWeeks(currentDate, 1))
    else onDateChange(subMonths(currentDate, 1))
  }

  function goForward() {
    if (view === "day") onDateChange(addDays(currentDate, 1))
    else if (view === "week") onDateChange(addWeeks(currentDate, 1))
    else onDateChange(addMonths(currentDate, 1))
  }

  // ── Format the date display based on the current view ──
  function getDateDisplay(): string {
    if (view === "day") {
      // "Friday, April 4, 2026"
      return format(currentDate, "EEEE, MMMM d, yyyy")
    }
    if (view === "week") {
      // "Mar 30 — Apr 5, 2026"
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(weekStart, "MMM d")} — ${format(weekEnd, "MMM d, yyyy")}`
    }
    // "April 2026"
    return format(currentDate, "MMMM yyyy")
  }

  return (
    <div className="flex items-center justify-between border-b border-[#e5e5e5] bg-white px-4 py-2.5">
      {/* Left side: navigation */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-blue-800">Turnera</span>
        <span className="text-gray-300">|</span>

        {/* Arrow buttons — square, small, clean */}
        <div className="flex items-center gap-1">
          <button
            onClick={goBack}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#e5e5e5] bg-white text-sm text-gray-600 hover:bg-gray-50"
          >
            ‹
          </button>
          <button
            onClick={goForward}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#e5e5e5] bg-white text-sm text-gray-600 hover:bg-gray-50"
          >
            ›
          </button>
        </div>

        {/* Date display */}
        <span className="text-sm font-bold">{getDateDisplay()}</span>

        {/* "Today" pill button — jumps back to today */}
        <button
          onClick={() => onDateChange(new Date())}
          className="rounded-full border border-blue-500 px-3 py-0.5 text-xs text-blue-500 hover:bg-blue-50"
        >
          Today
        </button>
      </div>

      {/* Right side: view toggle + doctor selector + new appointment */}
      <div className="flex items-center gap-2">
        {/* Doctor selector — only visible in week view */}
        {view === "week" && doctors.length > 0 && (
          <select
            value={selectedDoctorId || ""}
            onChange={(e) => onDoctorChange?.(e.target.value)}
            className="rounded-md border border-[#e5e5e5] px-2 py-1 text-xs text-gray-600"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.last_name}
              </option>
            ))}
          </select>
        )}

        {/* View toggle: Day | Week | Month */}
        <div className="flex overflow-hidden rounded-md border border-[#e5e5e5]">
          {(["day", "week", "month"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1 text-xs ${
                view === v
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              } ${v !== "day" ? "border-l border-[#e5e5e5]" : ""}`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* New appointment button — only for admin and secretary */}
        {(role === "admin" || role === "secretary") && (
          <Button
            onClick={onNewAppointment}
            className="bg-blue-500 shadow-none hover:bg-blue-600"
            size="sm"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            New appointment
          </Button>
        )}
      </div>
    </div>
  )
}
