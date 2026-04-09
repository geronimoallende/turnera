/**
 * WeekView — Single FullCalendar instance showing one week.
 *
 * Unlike the day view (which shows multiple doctor columns),
 * the week view shows one doctor at a time because there isn't
 * enough horizontal space for both 7 days AND multiple doctors.
 *
 * The doctor is selected via a dropdown in CalendarHeader.
 * Appointment blocks are compact (last name only).
 */

"use client"

import { useCallback, useMemo } from "react"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { EventContentArg, EventClickArg, DateSelectArg } from "@fullcalendar/core"
import { EventBlock } from "./event-block"
import type { AppointmentListItem } from "@/lib/hooks/use-appointments"
import type { EffectiveSchedule } from "@/lib/schedule-utils"

type WeekViewProps = {
  date: Date
  appointments: AppointmentListItem[]
  doctorId: string
  /** Schedule per date string "YYYY-MM-DD" → EffectiveSchedule */
  weekSchedules?: Record<string, EffectiveSchedule>
  onEventClick: (appointmentId: string) => void
  onSlotSelect: (info: { start: Date; end: Date; doctorId: string }) => void
}

function appointmentsToEvents(appointments: AppointmentListItem[]) {
  return appointments.map((apt) => ({
    id: apt.id,
    start: new Date(`${apt.appointment_date}T${apt.start_time}`),
    end: new Date(`${apt.appointment_date}T${apt.end_time}`),
    title: `${apt.clinic_patients.last_name}`,
    extendedProps: {
      patientName: `${apt.clinic_patients.first_name} ${apt.clinic_patients.last_name}`,
      status: apt.status,
      reason: apt.reason,
      isOverbooking: apt.is_overbooking,
      duration: apt.duration_minutes,
      doctorId: apt.doctors.id,
    },
  }))
}

export function WeekView({
  date,
  appointments,
  doctorId,
  weekSchedules = {},
  onEventClick,
  onSlotSelect,
}: WeekViewProps) {
  // Filter out cancelled/rescheduled — same as custom day grid
  const HIDDEN = new Set(["cancelled_patient", "cancelled_doctor", "rescheduled"])
  const visibleAppointments = appointments.filter((a) => !HIDDEN.has(a.status))
  const events = appointmentsToEvents(visibleAppointments)

  // Convert per-date schedules → FullCalendar businessHours
  const businessHoursConfig = useMemo(() => {
    const entries = Object.entries(weekSchedules)
    if (entries.length === 0) return undefined
    const hours: Array<{ daysOfWeek: number[]; startTime: string; endTime: string }> = []
    for (const [dateStr, schedule] of entries) {
      if (schedule.blocks.length === 0) continue
      const dow = new Date(dateStr + "T12:00:00").getUTCDay()
      for (const block of schedule.blocks) {
        hours.push({ daysOfWeek: [dow], startTime: block.start_time, endTime: block.end_time })
      }
    }
    return hours.length > 0 ? hours : undefined
  }, [weekSchedules])

  const hasSchedule = !!businessHoursConfig

  const handleEventClick = useCallback(
    (info: EventClickArg) => onEventClick(info.event.id),
    [onEventClick]
  )

  const handleSelect = useCallback(
    (info: DateSelectArg) => {
      onSlotSelect({ start: info.start, end: info.end, doctorId })
    },
    [onSlotSelect, appointments]
  )

  // Compact renderer — shows only time + last name (less space per block)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderEventContent = useCallback((info: EventContentArg) => {
    return (
      <EventBlock
        event={info.event as any}
        compact={true}
      />
    )
  }, [])

  return (
    <div className="h-full">
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        initialDate={date}
        headerToolbar={false}
        // Week starts on Monday (1) not Sunday (0)
        firstDay={1}
        slotDuration="00:15:00"
        slotLabelInterval="00:30:00"
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        scrollTime="07:30:00"
        businessHours={businessHoursConfig}
        {...(hasSchedule ? { selectConstraint: "businessHours" as const } : {})}
        selectable={true}
        selectMirror={true}
        selectOverlap={false}
        select={handleSelect}
        editable={true}
        snapDuration="00:15:00"
        eventClick={handleEventClick}
        nowIndicator={true}
        allDaySlot={false}
        height="100%"
        events={events}
        eventContent={renderEventContent}
      />
    </div>
  )
}

type EventBlockEventType = {
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
