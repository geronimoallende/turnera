/**
 * DoctorColumn — A single FullCalendar time grid for one doctor.
 *
 * The day view shows multiple doctor columns side by side.
 * Each column is an independent FullCalendar instance that shows
 * only that doctor's appointments.
 *
 * Why separate instances instead of one big calendar?
 * FullCalendar's "resource" view (which does multi-column natively)
 * requires the premium license ($480/year). By using N separate
 * instances in a flex container, we get the same visual result for free.
 *
 * The trade-off: we need to manually sync navigation (when you click
 * "next day" on one column, all others must follow). That's handled
 * by the parent component (MultiDoctorGrid).
 */

"use client"

import { useMemo, useCallback, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { EventContentArg, EventClickArg, EventDropArg, DateSelectArg } from "@fullcalendar/core"
import { EventBlock } from "./event-block"
import type { AppointmentListItem } from "@/lib/hooks/use-appointments"
import type { TimeBlock } from "@/lib/schedule-utils"

type DoctorColumnProps = {
  doctorId: string
  doctorName: string
  specialty: string
  color: string
  date: Date
  // Only this doctor's appointments (filtered by parent)
  appointments: AppointmentListItem[]
  // Is this the first (leftmost) column? Only it shows time labels
  isFirst: boolean
  // ── Schedule data (all optional — safe defaults prevent crashes) ──
  scheduleBlocks?: TimeBlock[]
  isBlocked?: boolean
  blockReason?: string | null
  // Callbacks to parent
  onSlotSelect: (info: { start: Date; end: Date; doctorId: string }) => void
  onEventClick: (appointmentId: string) => void
  onEventDrop: (
    appointmentId: string,
    newStart: Date,
    newEnd: Date,
    revert: () => void
  ) => void
  // Ref so the parent can call .gotoDate() to sync navigation
  calendarRef: React.RefObject<FullCalendar | null>
}

/**
 * Transform our API data into FullCalendar's event format.
 *
 * FullCalendar expects events in a specific shape:
 *   { id, start, end, title, extendedProps: { ... } }
 *
 * We convert our appointment data to match this format.
 * The extendedProps are passed to our custom EventBlock renderer.
 */
function appointmentsToEvents(appointments: AppointmentListItem[]) {
  return appointments.map((apt) => {
    // Combine date + time into a full Date object
    // "2026-04-04" + "09:30:00" → Date("2026-04-04T09:30:00")
    const start = new Date(`${apt.appointment_date}T${apt.start_time}`)
    const end = new Date(`${apt.appointment_date}T${apt.end_time}`)

    return {
      id: apt.id,
      start,
      end,
      // Title is used by FullCalendar for accessibility (screen readers)
      title: `${apt.clinic_patients.last_name} - ${apt.reason || "Appointment"}`,
      // Our custom data — passed to EventBlock via event.extendedProps
      extendedProps: {
        patientName: `${apt.clinic_patients.first_name} ${apt.clinic_patients.last_name}`,
        status: apt.status,
        reason: apt.reason,
        isOverbooking: apt.is_overbooking,
        duration: apt.duration_minutes,
      },
    }
  })
}

export function DoctorColumn({
  doctorId,
  doctorName,
  specialty,
  color,
  date,
  appointments,
  isFirst,
  scheduleBlocks = [],
  isBlocked = false,
  blockReason = null,
  onSlotSelect,
  onEventClick,
  onEventDrop,
  calendarRef,
}: DoctorColumnProps) {
  // Convert our appointment data to FullCalendar events
  const events = appointmentsToEvents(appointments)

  // Convert schedule blocks → FullCalendar businessHours format
  // When no blocks: undefined → no businessHours → column stays all-white (current behavior)
  const dayOfWeek = date.getDay()
  const businessHoursConfig = useMemo(() => {
    if (scheduleBlocks.length === 0) return undefined
    return scheduleBlocks.map((block) => ({
      daysOfWeek: [dayOfWeek],
      startTime: block.start_time,
      endTime: block.end_time,
    }))
  }, [scheduleBlocks, dayOfWeek])

  const hasSchedule = scheduleBlocks.length > 0

  // ── Sync date when prop changes ────────────────────────────
  // initialDate only works on first render. When the user picks
  // a new date from the sidebar, we need to tell FullCalendar
  // to navigate to it via the API.
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (api) {
      api.gotoDate(date)
    }
  }, [date, calendarRef])

  // ── Event handlers ──────────────────────────────────────────

  // Called when the user clicks on an empty time slot
  // FullCalendar gives us the start/end of the selected range
  const handleSelect = useCallback(
    (info: DateSelectArg) => {
      onSlotSelect({ start: info.start, end: info.end, doctorId })
    },
    [onSlotSelect, doctorId]
  )

  // Called when the user clicks on an existing appointment block
  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      onEventClick(info.event.id)
    },
    [onEventClick]
  )

  // Called when the user drags an appointment block to a new time
  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      onEventDrop(
        info.event.id,
        info.event.start!,
        info.event.end!,
        info.revert // Function to undo the drag if user cancels
      )
    },
    [onEventDrop]
  )

  // Custom renderer for each event block — replaces FullCalendar's default
  // info.event has: start, end, extendedProps — we pass it directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderEventContent = useCallback((info: EventContentArg) => {
    return <EventBlock event={info.event as any} />
  }, [])

  return (
    <div className={`doctor-col flex min-w-[200px] flex-1 flex-col ${isBlocked ? "doctor-column-blocked" : ""}`}>
      {/* Doctor name header — colored to match this column */}
      <div
        className="border-b-2 border-l border-[#e5e5e5] px-2 py-2 text-center"
        style={{ borderBottomColor: color }}
      >
        <div className="text-xs font-semibold" style={{ color }}>
          {doctorName}
        </div>
        <div className="text-[10px] text-gray-400">{specialty}</div>
      </div>

      {/* Banner for blocked or no-schedule state */}
      {isBlocked && (
        <div className="doctor-column-banner doctor-column-banner--blocked">
          {blockReason || "Day off"}
        </div>
      )}
      {!isBlocked && !hasSchedule && (
        <div className="doctor-column-banner doctor-column-banner--no-schedule">
          No schedule configured
        </div>
      )}

      {/* The FullCalendar instance */}
      <div className="flex-1 overflow-hidden border-l border-[#e5e5e5]">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridDay"
          initialDate={date}
          headerToolbar={false}
          slotDuration="00:15:00"
          slotLabelInterval="00:30:00"
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          scrollTime="07:30:00"
          slotLabelContent={isFirst ? undefined : () => null}
          // ── Schedule: business hours ──
          businessHours={businessHoursConfig}
          // Only constrain selection when schedule exists
          {...(hasSchedule ? { selectConstraint: "businessHours" as const } : {})}
          // ── Selection ──
          selectable={!isBlocked}
          selectMirror={true}
          selectOverlap={false}
          select={handleSelect}
          // ── Drag and drop ──
          // No eventConstraint — entreturnos must be draggable anywhere
          editable={!isBlocked}
          snapDuration="00:15:00"
          eventDrop={handleEventDrop}
          eventClick={handleEventClick}
          // ── Visual ──
          nowIndicator={true}
          allDaySlot={false}
          dayHeaders={false}
          height="100%"
          events={events}
          eventContent={renderEventContent}
        />
      </div>
    </div>
  )
}

// Type helper for the EventBlock component
type EventBlockProps = {
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
}
