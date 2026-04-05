/**
 * MultiDoctorGrid — Flex container that renders multiple DoctorColumns
 * and keeps their navigation in sync.
 *
 * When the user navigates (e.g., clicks "next day"), the first column
 * fires a datesSet callback. We then call gotoDate() on all other
 * columns so they all show the same day.
 *
 * Layout:
 *   ┌──────────┬──────────┬──────────┐
 *   │ Dr. A    │ Dr. B    │ Dr. C    │
 *   │ 08:00 .. │ 08:00 .. │ 08:00 .. │
 *   │ 08:30 .. │ 08:30 .. │ 08:30 .. │
 *   │ 09:00 .. │ 09:00 .. │ 09:00 .. │
 *   └──────────┴──────────┴──────────┘
 *
 * Each column is an independent FullCalendar instance.
 * Only the first column shows time labels (08:00, 08:30...).
 */

"use client"

import { useRef, useMemo } from "react"
import FullCalendar from "@fullcalendar/react"
import { DoctorColumn } from "./doctor-column"
import type { AppointmentListItem } from "@/lib/hooks/use-appointments"

type Doctor = {
  id: string
  first_name: string
  last_name: string
  specialty: string
  color: string
}

type MultiDoctorGridProps = {
  date: Date
  doctors: Doctor[]
  appointments: AppointmentListItem[]
  onSlotSelect: (info: { start: Date; end: Date; doctorId: string }) => void
  onEventClick: (appointmentId: string) => void
  onEventDrop: (
    appointmentId: string,
    newStart: Date,
    newEnd: Date,
    revert: () => void
  ) => void
}

export function MultiDoctorGrid({
  date,
  doctors,
  appointments,
  onSlotSelect,
  onEventClick,
  onEventDrop,
}: MultiDoctorGridProps) {
  // Create a ref for each doctor's FullCalendar instance.
  // useRef stores a value that persists across renders (like a variable
  // that doesn't reset when the component re-renders).
  //
  // We need refs so we can call calendarRef.current.getApi().gotoDate()
  // to sync navigation between columns.
  const calendarRefs = useRef<Map<string, FullCalendar | null>>(new Map())

  // Filter appointments per doctor.
  // useMemo caches the result so we don't re-filter on every render
  // unless the appointments or doctors arrays actually change.
  const appointmentsByDoctor = useMemo(() => {
    const map = new Map<string, AppointmentListItem[]>()
    for (const doctor of doctors) {
      // For each doctor, find their appointments from the full list
      // by matching the doctor ID in the joined doctors object
      map.set(
        doctor.id,
        appointments.filter((a) => a.doctors.id === doctor.id)
      )
    }
    return map
  }, [appointments, doctors])

  // Show a message if no doctors are selected
  if (doctors.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        Select at least one doctor from the sidebar
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-x-auto">
      {doctors.map((doctor, index) => (
        <DoctorColumn
          key={doctor.id}
          doctorId={doctor.id}
          doctorName={`Dr. ${doctor.last_name}`}
          specialty={doctor.specialty}
          color={doctor.color}
          date={date}
          appointments={appointmentsByDoctor.get(doctor.id) || []}
          isFirst={index === 0}
          onSlotSelect={onSlotSelect}
          onEventClick={onEventClick}
          onEventDrop={onEventDrop}
          calendarRef={{
            // This creates a ref object for each doctor that stores/retrieves
            // the FullCalendar instance in our Map
            get current() {
              return calendarRefs.current.get(doctor.id) || null
            },
            set current(val) {
              calendarRefs.current.set(doctor.id, val)
            },
          }}
        />
      ))}
    </div>
  )
}
