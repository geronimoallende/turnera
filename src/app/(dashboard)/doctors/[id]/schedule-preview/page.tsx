/**
 * Schedule Preview Page — /doctors/[id]/schedule-preview
 *
 * Shows a visual week-long calendar for a single doctor with:
 *   - Business hours highlighted (from doctor_schedules)
 *   - Schedule overrides visible as colored background events
 *   - Existing appointments overlaid
 *   - Week-by-week navigation
 */

"use client"

import { use, useState, useMemo } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from "date-fns"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClinic } from "@/providers/clinic-provider"
import { useDoctor, useDoctorSchedules, useDoctorOverrides } from "@/lib/hooks/use-doctors"
import { useAppointments } from "@/lib/hooks/use-appointments"
import { computeEffectiveSchedule, type EffectiveSchedule } from "@/lib/schedule-utils"

import timeGridPlugin from "@fullcalendar/timegrid"

const FullCalendar = dynamic(
  () => import("@fullcalendar/react").then((m) => ({ default: m.default })),
  { ssr: false, loading: () => <div className="p-8 text-center text-sm text-gray-400">Loading calendar...</div> }
)

export default function SchedulePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: doctorId } = use(params)
  const { activeClinicId } = useClinic()
  const [currentDate, setCurrentDate] = useState(new Date())

  const { data: doctorData } = useDoctor(doctorId, activeClinicId)
  const { data: schedulesData } = useDoctorSchedules(doctorId, activeClinicId)
  const { data: overridesData } = useDoctorOverrides(doctorId, activeClinicId)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  const { data: appointmentsData } = useAppointments(activeClinicId, {
    start_date: format(weekStart, "yyyy-MM-dd"),
    end_date: format(weekEnd, "yyyy-MM-dd"),
    doctor_id: doctorId,
  })

  const doctor = doctorData?.data
  const schedules = schedulesData?.data ?? []
  const overrides = overridesData?.data ?? []
  const appointments = appointmentsData?.data ?? []

  // Convert schedules → FullCalendar businessHours
  const businessHoursConfig = useMemo(() => {
    if (schedules.length === 0) return undefined
    return schedules
      .filter((s: { is_active: boolean | null }) => s.is_active ?? true)
      .map((s: { day_of_week: number; start_time: string; end_time: string }) => ({
        daysOfWeek: [s.day_of_week],
        startTime: s.start_time,
        endTime: s.end_time,
      }))
  }, [schedules])

  // Convert overrides → background events
  const overrideEvents = useMemo(() => {
    return overrides.map((o: { id: string; override_date: string; override_type: string; start_time: string | null; end_time: string | null; reason: string | null }) => {
      const isBlock = o.override_type === "block"
      if (!o.start_time || !o.end_time) {
        return {
          id: `ov-${o.id}`, start: o.override_date, end: o.override_date,
          allDay: true, display: "background" as const,
          backgroundColor: isBlock ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
        }
      }
      return {
        id: `ov-${o.id}`,
        start: `${o.override_date}T${o.start_time}`,
        end: `${o.override_date}T${o.end_time}`,
        display: "background" as const,
        backgroundColor: isBlock ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
      }
    })
  }, [overrides])

  const appointmentEvents = useMemo(() => {
    return appointments.map((apt) => ({
      id: apt.id,
      start: new Date(`${apt.appointment_date}T${apt.start_time}`),
      end: new Date(`${apt.appointment_date}T${apt.end_time}`),
      title: `${apt.clinic_patients.last_name} - ${apt.reason || "Apt"}`,
      backgroundColor: "#3b82f6", borderColor: "#2563eb", textColor: "#fff",
    }))
  }, [appointments])

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link href={`/doctors/${doctorId}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a1a1a]">
        <ArrowLeft className="h-4 w-4" /> Back to doctor profile
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a1a]">
            Schedule Preview{doctor && ` — ${doctor.first_name} ${doctor.last_name}`}
          </h1>
          <p className="text-sm text-gray-500">Preview how the calendar displays this doctor&apos;s schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate((d) => subWeeks(d, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate((d) => addWeeks(d, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <span className="text-sm font-medium text-gray-600">
            {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-[#e5e5e5] bg-white px-4 py-2 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded border border-gray-200 bg-white" /> Working hours</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-gray-200/50" /> Outside hours</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-red-100" /> Blocked</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-green-100" /> Extra hours</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-blue-500" /> Appointment</div>
      </div>

      <div className="rounded-lg border border-[#e5e5e5] bg-white p-2">
        <FullCalendar
          plugins={[timeGridPlugin]}
          initialView="timeGridWeek"
          initialDate={currentDate}
          headerToolbar={false}
          firstDay={1}
          slotDuration="00:15:00"
          slotLabelInterval="00:30:00"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          scrollTime="07:30:00"
          businessHours={businessHoursConfig}
          nowIndicator={true}
          allDaySlot={true}
          selectable={false}
          editable={false}
          height="auto"
          events={[...overrideEvents, ...appointmentEvents]}
        />
      </div>

      {schedules.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No schedule configured. Go to the{" "}
          <Link href={`/doctors/${doctorId}`} className="font-medium underline">doctor profile</Link>{" "}
          to add schedule blocks.
        </div>
      )}
    </div>
  )
}
