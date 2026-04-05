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

import { useState, useCallback, useEffect, useRef } from "react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { toast } from "sonner"
import { useClinic } from "@/providers/clinic-provider"
import { useDoctors } from "@/lib/hooks/use-doctors"
import {
  useAppointments,
  useRescheduleAppointment,
} from "@/lib/hooks/use-appointments"
import type { AppointmentFilters } from "@/lib/hooks/use-appointments"
import { CalendarHeader } from "@/components/calendar/calendar-header"
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar"
import { MultiDoctorGrid } from "@/components/calendar/multi-doctor-grid"
import { WeekView } from "@/components/calendar/week-view"
import { MonthView } from "@/components/calendar/month-view"
import { AppointmentSidePanel } from "@/components/calendar/side-panel/appointment-side-panel"
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

  // ── Drag-and-drop rescheduling ─────────────────────────────
  // When the secretary drags an appointment block to a new time,
  // we store the drag info and show a confirmation.
  // The revert function is stored in a ref (not state) because
  // calling setRevert would trigger a re-render, but we just need
  // to keep the function around to call it if the user cancels.
  const [dragInfo, setDragInfo] = useState<{
    appointmentId: string
    newStart: Date
    newEnd: Date
  } | null>(null)
  const revertRef = useRef<(() => void) | null>(null)

  const handleEventDrop = useCallback(
    (
      appointmentId: string,
      newStart: Date,
      newEnd: Date,
      revert: () => void
    ) => {
      // Store the drag details + revert function
      setDragInfo({ appointmentId, newStart, newEnd })
      revertRef.current = revert
    },
    []
  )

  // Reschedule mutation — must be at top level (React hook rule)
  // We pass a placeholder ID and override it in the mutate call
  const rescheduleAppointment = useRescheduleAppointment(
    dragInfo?.appointmentId ?? ""
  )

  // Called when user confirms the reschedule
  function handleConfirmReschedule() {
    if (!dragInfo || !activeClinicId) return

    rescheduleAppointment.mutate(
      {
        clinic_id: activeClinicId,
        new_date: format(dragInfo.newStart, "yyyy-MM-dd"),
        new_start_time: format(dragInfo.newStart, "HH:mm"),
      },
      {
        onSuccess: () => {
          toast.success("Appointment rescheduled")
          setDragInfo(null)
          revertRef.current = null
        },
        onError: (error) => {
          toast.error(error.message)
          revertRef.current?.()
          setDragInfo(null)
          revertRef.current = null
        },
      }
    )
  }

  // Called when user cancels the reschedule
  function handleCancelReschedule() {
    revertRef.current?.()
    setDragInfo(null)
    revertRef.current = null
  }

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

        {/* Right: Side panel */}
        {panelMode !== "closed" && (
          <AppointmentSidePanel
            mode={panelMode as "new" | "detail"}
            appointmentId={selectedAppointmentId}
            slotInfo={slotInfo}
            clinicId={activeClinicId}
            role={activeRole}
            doctorName={
              slotInfo
                ? doctors.find((d) => d.id === slotInfo.doctorId)?.full_name || undefined
                : undefined
            }
            onClose={handleClosePanel}
          />
        )}
      </div>

      {/* Drag-and-drop confirmation dialog */}
      {dragInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-[360px] rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-sm font-semibold">
              Reschedule appointment?
            </h3>
            <p className="mb-4 text-xs text-gray-500">
              Move to {format(dragInfo.newStart, "EEE, MMM d")} at{" "}
              {format(dragInfo.newStart, "HH:mm")} -{" "}
              {format(dragInfo.newEnd, "HH:mm")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmReschedule}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
              >
                Confirm
              </button>
              <button
                onClick={handleCancelReschedule}
                className="flex-1 rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
