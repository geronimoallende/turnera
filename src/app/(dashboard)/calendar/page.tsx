/**
 * Calendar Page — The main screen secretaries use 8 hours/day.
 *
 * This page assembles all the calendar components:
 *   - CalendarHeader (top: navigation, view toggle, new appointment button)
 *   - CalendarSidebar (left: date picker, doctor checkboxes, status legend)
 *   - MultiDoctorGrid / WeekView / MonthView (center: the actual calendar)
 *   - AppointmentSidePanel (right: booking form or appointment detail)
 *
 * State management:
 *   - view: which view is active (day/week/month)
 *   - currentDate: what date the calendar is showing
 *   - selectedDoctorIds: which doctor columns are visible (day view)
 *   - panelMode: is the side panel open, and in what mode (new/detail/closed)
 *
 * Data flow:
 *   1. Page fetches appointments via useAppointments hook
 *   2. Passes them to the active view component
 *   3. User clicks a slot → opens booking panel
 *   4. User clicks an appointment → opens detail panel
 *   5. Mutations (create, status change) invalidate cache → calendar refetches
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { useClinic } from "@/providers/clinic-provider"
import { useDoctors } from "@/lib/hooks/use-doctors"
import { useAppointments } from "@/lib/hooks/use-appointments"
import type { AppointmentFilters } from "@/lib/hooks/use-appointments"
import { CalendarHeader } from "@/components/calendar/calendar-header"
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar"
import { MultiDoctorGrid } from "@/components/calendar/multi-doctor-grid"
import { WeekView } from "@/components/calendar/week-view"
import { MonthView } from "@/components/calendar/month-view"
import { DOCTOR_COLORS } from "@/lib/constants/appointment-status"

// ─── Page Component ──────────────────────────────────────────────

export default function CalendarPage() {
  // Get the active clinic and user's role from context
  const { activeClinicId, activeRole } = useClinic()

  // ── View state ───────────────────────────────────────────────
  const [view, setView] = useState<"day" | "week" | "month">("day")
  const [currentDate, setCurrentDate] = useState(new Date())

  // ── Doctor selection state (day view) ────────────────────────
  // Which doctor columns are visible in the day view
  const [selectedDoctorIds, setSelectedDoctorIds] = useState<string[]>([])
  // Which doctor is selected in the week view dropdown
  const [weekViewDoctorId, setWeekViewDoctorId] = useState<string>("")

  // ── Side panel state ─────────────────────────────────────────
  // "closed" = no panel shown
  // "new" = booking form (creating a new appointment)
  // "detail" = appointment detail (viewing/modifying an existing one)
  const [panelMode, setPanelMode] = useState<"closed" | "new" | "detail">(
    "closed"
  )
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null)
  // Info about the clicked slot (doctor, start time, end time)
  const [slotInfo, setSlotInfo] = useState<{
    start: Date
    end: Date
    doctorId: string
  } | null>(null)

  // ── Fetch doctors for this clinic ────────────────────────────
  const { data: doctorsData } = useDoctors(activeClinicId)
  // Assign a color to each doctor from our fixed palette
  const doctors = (doctorsData?.data ?? []).map((d, i) => ({
    ...d,
    color: DOCTOR_COLORS[i % DOCTOR_COLORS.length],
  }))

  // ── Auto-select first 3 doctors when data loads ──────────────
  // This runs once when the doctors list first arrives from the API.
  // Without this, the day view would start empty (no columns selected).
  useEffect(() => {
    if (doctors.length > 0 && selectedDoctorIds.length === 0) {
      setSelectedDoctorIds(doctors.slice(0, 3).map((d) => d.id))
    }
    if (doctors.length > 0 && !weekViewDoctorId) {
      setWeekViewDoctorId(doctors[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors.length])

  // ── Build date filters based on current view ─────────────────
  // The API accepts different filter params depending on the view:
  //   Day:   ?date=2026-04-04
  //   Week:  ?start_date=2026-03-30&end_date=2026-04-05
  //   Month: ?start_date=2026-04-01&end_date=2026-04-30
  const filters: AppointmentFilters =
    view === "day"
      ? { date: format(currentDate, "yyyy-MM-dd") }
      : view === "week"
        ? {
            start_date: format(
              startOfWeek(currentDate, { weekStartsOn: 1 }),
              "yyyy-MM-dd"
            ),
            end_date: format(
              endOfWeek(currentDate, { weekStartsOn: 1 }),
              "yyyy-MM-dd"
            ),
            doctor_id: weekViewDoctorId || undefined,
          }
        : {
            start_date: format(startOfMonth(currentDate), "yyyy-MM-dd"),
            end_date: format(endOfMonth(currentDate), "yyyy-MM-dd"),
          }

  // ── Fetch appointments with the filters ──────────────────────
  const { data: appointmentsData } = useAppointments(activeClinicId, filters)
  const appointments = appointmentsData?.data ?? []

  // ── Event handlers ───────────────────────────────────────────

  // User clicked an empty time slot → open booking panel
  const handleSlotSelect = useCallback(
    (info: { start: Date; end: Date; doctorId: string }) => {
      setSlotInfo(info)
      setSelectedAppointmentId(null)
      setPanelMode("new")
    },
    []
  )

  // User clicked an existing appointment block → open detail panel
  const handleEventClick = useCallback((appointmentId: string) => {
    setSelectedAppointmentId(appointmentId)
    setSlotInfo(null)
    setPanelMode("detail")
  }, [])

  // Close the side panel
  const handleClosePanel = useCallback(() => {
    setPanelMode("closed")
    setSelectedAppointmentId(null)
    setSlotInfo(null)
  }, [])

  // Toggle a doctor column on/off in the day view
  // Max 5 columns — if already at 5, don't add more
  const handleDoctorToggle = useCallback((doctorId: string) => {
    setSelectedDoctorIds((prev) =>
      prev.includes(doctorId)
        ? prev.filter((id) => id !== doctorId)
        : prev.length < 5
          ? [...prev, doctorId]
          : prev
    )
  }, [])

  // ── Keyboard shortcuts ───────────────────────────────────────
  // Esc = close panel, Ctrl+N = new appointment
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClosePanel()
      }
      if (e.key === "n" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setPanelMode("new")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleClosePanel])

  // Placeholder for drag-and-drop (Task 8)
  const handleEventDrop = useCallback(
    (
      _appointmentId: string,
      _newStart: Date,
      _newEnd: Date,
      revert: () => void
    ) => {
      // Will be implemented in Task 8
      revert()
    },
    []
  )

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      {/* Top header bar */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onNewAppointment={() => setPanelMode("new")}
        selectedDoctorId={weekViewDoctorId}
        onDoctorChange={setWeekViewDoctorId}
        doctors={doctors}
        role={activeRole}
      />

      {/* Main content area: sidebar + calendar + side panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — only in day view */}
        {view === "day" && (
          <CalendarSidebar
            currentDate={currentDate}
            onDateSelect={setCurrentDate}
            doctors={doctors}
            selectedDoctorIds={selectedDoctorIds}
            onDoctorToggle={handleDoctorToggle}
          />
        )}

        {/* Center: the active calendar view */}
        <div className="flex-1 overflow-hidden">
          {view === "day" && (
            <MultiDoctorGrid
              date={currentDate}
              doctors={doctors.filter((d) =>
                selectedDoctorIds.includes(d.id)
              )}
              appointments={appointments}
              onSlotSelect={handleSlotSelect}
              onEventClick={handleEventClick}
              onEventDrop={handleEventDrop}
            />
          )}
          {view === "week" && (
            <WeekView
              date={currentDate}
              appointments={appointments}
              onEventClick={handleEventClick}
              onSlotSelect={handleSlotSelect}
            />
          )}
          {view === "month" && (
            <MonthView
              date={currentDate}
              appointments={appointments}
              onDayClick={(clickedDate) => {
                setCurrentDate(clickedDate)
                setView("day")
              }}
            />
          )}
        </div>

        {/* Right: Side panel (Task 7 — placeholder for now) */}
        {panelMode !== "closed" && (
          <div className="w-[360px] shrink-0 border-l border-[#e5e5e5] bg-white p-4 shadow-[-2px_0_8px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {panelMode === "new" ? "New appointment" : "Appointment detail"}
              </h3>
              <button
                onClick={handleClosePanel}
                className="text-lg text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              {panelMode === "new" && slotInfo
                ? `Booking for ${format(slotInfo.start, "HH:mm")} - ${format(slotInfo.end, "HH:mm")}`
                : panelMode === "detail" && selectedAppointmentId
                  ? `Appointment: ${selectedAppointmentId.slice(0, 8)}...`
                  : "Select a time slot or appointment"}
            </p>
            {/* Full implementation in Task 7 */}
          </div>
        )}
      </div>
    </div>
  )
}
