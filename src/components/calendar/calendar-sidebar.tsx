/**
 * CalendarSidebar — Left panel of the calendar page (day view only).
 *
 * Contains three sections:
 *   1. Mini calendar — a small month view for quick date navigation
 *   2. Doctor checkboxes — toggle which doctors' columns are visible
 *   3. Status legend — color reference for appointment statuses
 *
 * The sidebar is 200px wide and only shows in day view.
 * In week/month view it's hidden (not enough screen space).
 */

"use client"

import { Input } from "@/components/ui/input"
import { APPOINTMENT_STATUS_COLORS } from "@/lib/constants/appointment-status"

type Doctor = {
  id: string
  first_name: string
  last_name: string
  color: string
}

type CalendarSidebarProps = {
  currentDate: Date
  onDateSelect: (date: Date) => void
  doctors: Doctor[]
  selectedDoctorIds: string[]
  onDoctorToggle: (doctorId: string) => void
}

export function CalendarSidebar({
  currentDate,
  onDateSelect,
  doctors,
  selectedDoctorIds,
  onDoctorToggle,
}: CalendarSidebarProps) {
  // Format current date for the HTML date input (YYYY-MM-DD)
  const dateValue = currentDate.toISOString().split("T")[0]

  // Status legend entries — what each color means
  const statusLegend = [
    { label: "Confirmed", color: APPOINTMENT_STATUS_COLORS.confirmed },
    { label: "Arrived", color: APPOINTMENT_STATUS_COLORS.arrived },
    { label: "In progress", color: APPOINTMENT_STATUS_COLORS.in_progress },
    { label: "Completed", color: APPOINTMENT_STATUS_COLORS.completed },
    { label: "No show", color: APPOINTMENT_STATUS_COLORS.no_show },
    { label: "Cancelled", color: APPOINTMENT_STATUS_COLORS.cancelled_patient },
  ]

  return (
    <div className="flex w-[200px] shrink-0 flex-col overflow-y-auto border-r border-[#e5e5e5] bg-white p-3">
      {/* ── Section 1: Mini Calendar (date picker) ──────────────── */}
      {/* We use a native HTML date input for simplicity.
          Clicking a date changes the calendar to that day. */}
      <div className="mb-4">
        <Input
          type="date"
          value={dateValue}
          onChange={(e) => {
            if (e.target.value) {
              // Create date from the input value
              // We add "T12:00:00" to avoid timezone issues
              // (without it, "2026-04-04" might become April 3 in some timezones)
              onDateSelect(new Date(e.target.value + "T12:00:00"))
            }
          }}
          className="border-[#e5e5e5] text-xs shadow-none focus-visible:ring-blue-500"
        />
      </div>

      {/* ── Section 2: Doctor Checkboxes ─────────────────────────── */}
      {/* Each doctor has a colored dot matching their calendar column.
          Check = show their column. Uncheck = hide it.
          Max 5 selected at once (screen space limit). */}
      <div className="mb-4">
        <div className="mb-2 text-[11px] font-semibold text-gray-500">
          Doctors
        </div>
        <div className="flex flex-col gap-1.5">
          {doctors.map((doctor) => (
            <label
              key={doctor.id}
              className="flex cursor-pointer items-center gap-2 text-xs"
            >
              <input
                type="checkbox"
                checked={selectedDoctorIds.includes(doctor.id)}
                onChange={() => onDoctorToggle(doctor.id)}
                className="h-3.5 w-3.5 rounded border-gray-300"
                style={{ accentColor: doctor.color }}
              />
              {/* Colored dot — same color as the doctor's column header */}
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: doctor.color }}
              />
              <span className="truncate">
                Dr. {doctor.last_name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Section 3: Status Legend ─────────────────────────────── */}
      {/* Shows what each border color means.
          Same colors as the event blocks' left border. */}
      <div>
        <div className="mb-2 text-[11px] font-semibold text-gray-500">
          Status
        </div>
        <div className="flex flex-col gap-1">
          {statusLegend.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-[11px] text-gray-500"
            >
              {/* Small colored bar — same as the event block border */}
              <span
                className="inline-block h-[3px] w-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
