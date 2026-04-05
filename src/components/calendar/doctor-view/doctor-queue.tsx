/**
 * DoctorQueue — The doctor's "waiting room" view.
 *
 * Shows today's patients grouped by status:
 *   1. In progress (green) — the patient currently in the consultation room
 *   2. Waiting (yellow) — patients who arrived, sorted by arrival time
 *   3. Upcoming (gray) — confirmed but not yet arrived
 *
 * The doctor clicks "Start consultation" to call the next patient,
 * and "Complete consultation" when they're done.
 */

"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  useDoctorQueue,
  useUpdateAppointmentStatus,
} from "@/lib/hooks/use-appointments"
import type { AppointmentListItem } from "@/lib/hooks/use-appointments"

type DoctorQueueProps = {
  clinicId: string
  doctorId: string
}

export function DoctorQueue({ clinicId, doctorId }: DoctorQueueProps) {
  // Fetch the queue data — automatically refreshes every 30 seconds
  const { data: queue, isLoading } = useDoctorQueue(clinicId, doctorId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-gray-400">
        Loading queue...
      </div>
    )
  }

  if (!queue) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No appointments for today
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Waiting room</h3>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">
          {(queue.waiting.length + (queue.in_progress ? 1 : 0) + queue.upcoming.length)} today
        </span>
      </div>

      {/* ── In Progress ──────────────────────────────────────── */}
      {queue.in_progress && (
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-green-700">
            In progress
          </div>
          <InProgressCard
            appointment={queue.in_progress}
            clinicId={clinicId}
          />
        </div>
      )}

      {/* ── Waiting ──────────────────────────────────────────── */}
      {queue.waiting.length > 0 && (
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
            Waiting
          </div>
          <div className="flex flex-col gap-2">
            {queue.waiting.map((apt) => (
              <WaitingCard
                key={apt.id}
                appointment={apt}
                clinicId={clinicId}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming ─────────────────────────────────────────── */}
      {queue.upcoming.length > 0 && (
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Upcoming
          </div>
          <div className="flex flex-col gap-1.5">
            {queue.upcoming.map((apt) => (
              <UpcomingCard key={apt.id} appointment={apt} />
            ))}
          </div>
        </div>
      )}

      {/* ── No patients at all ───────────────────────────────── */}
      {!queue.in_progress &&
        queue.waiting.length === 0 &&
        queue.upcoming.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-400">
            No appointments for today
          </div>
        )}

      {/* ── Day summary footer ───────────────────────────────── */}
      <div className="mt-2 flex justify-between border-t border-[#f1f5f9] pt-3 text-[11px] text-gray-400">
        <span>Completed: {queue.completed}</span>
        <span>
          Remaining:{" "}
          {queue.waiting.length +
            (queue.in_progress ? 1 : 0) +
            queue.upcoming.length}
        </span>
        <span>No-shows: {queue.no_shows}</span>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────

/** The patient currently being seen by the doctor */
function InProgressCard({
  appointment,
  clinicId,
}: {
  appointment: AppointmentListItem
  clinicId: string
}) {
  const updateStatus = useUpdateAppointmentStatus(appointment.id)
  const patient = appointment.clinic_patients

  function handleComplete() {
    updateStatus.mutate(
      { clinic_id: clinicId, status: "completed" },
      {
        onSuccess: () => toast.success("Consultation completed"),
        onError: (err) => toast.error(err.message),
      }
    )
  }

  // Calculate how long the consultation has been going
  const startedAt = appointment.started_at
    ? new Date(appointment.started_at)
    : null
  const minutesElapsed = startedAt
    ? Math.round((Date.now() - startedAt.getTime()) / 60000)
    : 0

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
      <div className="mb-2">
        <div className="text-sm font-semibold">
          {patient.first_name} {patient.last_name}
        </div>
        <div className="text-[11px] text-gray-500">
          {appointment.start_time.slice(0, 5)} · {appointment.reason || "Appointment"}
          {patient.insurance_provider && ` · ${patient.insurance_provider}`}
        </div>
        <div className="text-[11px] text-gray-400">
          Started {minutesElapsed} min ago
        </div>
      </div>
      <Button
        onClick={handleComplete}
        disabled={updateStatus.isPending}
        className="w-full bg-blue-700 shadow-none hover:bg-blue-800"
        size="sm"
      >
        {updateStatus.isPending ? "Completing..." : "Complete consultation"}
      </Button>
    </div>
  )
}

/** A patient who arrived and is waiting to be called */
function WaitingCard({
  appointment,
  clinicId,
}: {
  appointment: AppointmentListItem
  clinicId: string
}) {
  const updateStatus = useUpdateAppointmentStatus(appointment.id)
  const patient = appointment.clinic_patients

  function handleStart() {
    updateStatus.mutate(
      { clinic_id: clinicId, status: "in_progress" },
      {
        onSuccess: () => toast.success("Consultation started"),
        onError: (err) => toast.error(err.message),
      }
    )
  }

  // How long they've been waiting since check-in
  const checkedInAt = appointment.checked_in_at
    ? new Date(appointment.checked_in_at)
    : null
  const waitMinutes = checkedInAt
    ? Math.round((Date.now() - checkedInAt.getTime()) / 60000)
    : 0

  return (
    <div className="rounded-lg border border-[#e5e5e5] bg-gray-50 p-3">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">
            {patient.first_name} {patient.last_name}
          </div>
          <div className="text-[11px] text-gray-500">
            {appointment.start_time.slice(0, 5)} · {appointment.reason || "Appointment"}
            {patient.insurance_provider && ` · ${patient.insurance_provider}`}
          </div>
          <div className="text-[11px] text-amber-500">
            Waiting {waitMinutes} min
          </div>
        </div>
        <span className="text-[11px] text-gray-400">
          No-shows: {patient.no_show_count ?? 0}
        </span>
      </div>
      <Button
        onClick={handleStart}
        disabled={updateStatus.isPending}
        className="w-full bg-green-700 shadow-none hover:bg-green-800"
        size="sm"
      >
        {updateStatus.isPending ? "Starting..." : "Start consultation"}
      </Button>
    </div>
  )
}

/** A confirmed patient who hasn't arrived yet */
function UpcomingCard({
  appointment,
}: {
  appointment: AppointmentListItem
}) {
  const patient = appointment.clinic_patients

  return (
    <div className="rounded-lg border border-[#f1f5f9] bg-white p-2.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500">
            {patient.first_name} {patient.last_name}
          </div>
          <div className="text-[11px] text-gray-400">
            {appointment.start_time.slice(0, 5)} · {appointment.reason || "Appointment"}
          </div>
        </div>
        <span className="rounded border border-blue-200 px-1.5 py-0.5 text-[10px] text-blue-500">
          Confirmed
        </span>
      </div>
    </div>
  )
}
