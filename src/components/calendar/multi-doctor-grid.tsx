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

import { useRef, useMemo, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import { DoctorColumn } from "./doctor-column"
import type { AppointmentListItem } from "@/lib/hooks/use-appointments"
import type { EffectiveSchedule } from "@/lib/schedule-utils"

type Doctor = {
  id: string
  full_name: string
  specialty: string | null
  color: string
}

type MultiDoctorGridProps = {
  date: Date
  doctors: Doctor[]
  appointments: AppointmentListItem[]
  /** Effective schedule per doctor (keyed by doctor ID). Empty object while loading. */
  schedulesByDoctor?: Record<string, EffectiveSchedule>
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
  schedulesByDoctor = {},
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

  // ── Scroll synchronization ──────────────────────────────────
  // Each DoctorColumn has its own FullCalendar with its own scroll.
  // We sync them so scrolling one scrolls all.
  const gridRef = useRef<HTMLDivElement>(null)
  const isSyncing = useRef(false)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    // FullCalendar renders its scroll containers asynchronously.
    // We wait a short moment for them to appear in the DOM,
    // then attach scroll listeners to keep all columns in sync.
    let cleanups: (() => void)[] = []

    function attachScrollSync() {
      // Clean up any previous listeners
      cleanups.forEach((fn) => fn())
      cleanups = []

      const scrollers = grid!.querySelectorAll<HTMLElement>(
        ".fc-scroller-liquid-absolute"
      )
      if (scrollers.length < 2) return

      const handleScroll = (source: HTMLElement) => () => {
        if (isSyncing.current) return
        isSyncing.current = true
        const { scrollTop } = source
        scrollers.forEach((el) => {
          if (el !== source) el.scrollTop = scrollTop
        })
        requestAnimationFrame(() => {
          isSyncing.current = false
        })
      }

      scrollers.forEach((el) => {
        const handler = handleScroll(el)
        el.addEventListener("scroll", handler, { passive: true })
        cleanups.push(() => el.removeEventListener("scroll", handler))
      })
    }

    // Try immediately, then retry after FullCalendar finishes rendering
    attachScrollSync()
    const timer = setTimeout(attachScrollSync, 500)

    return () => {
      clearTimeout(timer)
      cleanups.forEach((fn) => fn())
    }
  }, [doctors.length])

  // Show a message if no doctors are selected
  if (doctors.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        Select at least one doctor from the sidebar
      </div>
    )
  }

  return (
    <div ref={gridRef} className="multi-doctor-grid flex h-full overflow-x-auto">
      {doctors.map((doctor, index) => {
        const schedule = schedulesByDoctor[doctor.id]

        return (
          <DoctorColumn
            key={doctor.id}
            doctorId={doctor.id}
            doctorName={doctor.full_name}
            specialty={doctor.specialty || ""}
            color={doctor.color}
            date={date}
            appointments={appointmentsByDoctor.get(doctor.id) || []}
            isFirst={index === 0}
            scheduleBlocks={schedule?.blocks ?? []}
            isBlocked={schedule?.is_blocked ?? false}
            blockReason={schedule?.block_reason ?? null}
            onSlotSelect={onSlotSelect}
            onEventClick={onEventClick}
            onEventDrop={onEventDrop}
            calendarRef={{
              get current() {
                return calendarRefs.current.get(doctor.id) || null
              },
              set current(val) {
                calendarRefs.current.set(doctor.id, val)
              },
            }}
          />
        )
      })}
    </div>
  )
}
