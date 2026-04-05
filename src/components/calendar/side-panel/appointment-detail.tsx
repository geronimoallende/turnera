/**
 * AppointmentDetail — Shows full info about an existing appointment.
 *
 * Appears when the secretary clicks an appointment block in the calendar.
 * Shows:
 *   - Patient info (name, DNI, phone, insurance, no-show count)
 *   - Appointment info (doctor, date, time, type, status)
 *   - Action buttons (Arrived, Start consultation, Complete, No show)
 *   - Secondary actions (Reschedule, Cancel)
 *
 * The action buttons are CONTEXTUAL — only valid next transitions appear.
 * For example, if status is "confirmed", you see "Arrived" and "No show".
 * If status is "arrived", you see "Start consultation".
 * If status is "in_progress", you see "Complete".
 */

"use client"

import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  useAppointment,
  useUpdateAppointmentStatus,
  useRescheduleAppointment,
} from "@/lib/hooks/use-appointments"
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  VALID_TRANSITIONS,
} from "@/lib/constants/appointment-status"

type AppointmentDetailProps = {
  appointmentId: string
  clinicId: string
  role: string | null
  onClose: () => void
}

export function AppointmentDetail({
  appointmentId,
  clinicId,
  role,
  onClose,
}: AppointmentDetailProps) {
  // Fetch the full appointment detail
  const { data: appointmentData, isLoading } = useAppointment(
    appointmentId,
    clinicId
  )
  const appointment = appointmentData?.data

  // Mutation hooks
  const updateStatus = useUpdateAppointmentStatus(appointmentId)
  const rescheduleAppointment = useRescheduleAppointment(appointmentId)

  // State for the cancel confirmation dialog
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  // State for the reschedule form
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")

  // ── Loading state ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-gray-400">
        Loading...
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        Appointment not found
      </div>
    )
  }

  // ── Extract data from the joined response ────────────────────
  const patient = appointment.clinic_patients
  const doctor = appointment.doctors
  const status = appointment.status
  const statusColor = APPOINTMENT_STATUS_COLORS[status] || "#6b7280"
  const statusLabel = APPOINTMENT_STATUS_LABELS[status] || status

  // What status transitions are available from the current status?
  const availableTransitions = VALID_TRANSITIONS[status] || []

  // ── Status change handler ────────────────────────────────────
  function handleStatusChange(newStatus: string, reason?: string) {
    updateStatus.mutate(
      {
        clinic_id: clinicId,
        status: newStatus,
        cancellation_reason: reason,
      },
      {
        onSuccess: () => {
          toast.success(`Status changed to ${APPOINTMENT_STATUS_LABELS[newStatus] || newStatus}`)
          if (newStatus.startsWith("cancelled")) {
            onClose()
          }
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  // ── Cancel confirmation handler ──────────────────────────────
  function handleCancelConfirm() {
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason")
      return
    }
    handleStatusChange("cancelled_patient", cancelReason.trim())
    setShowCancelConfirm(false)
  }

  // ── Which action buttons to show based on role + status ──────
  const isAdminOrSecretary = role === "admin" || role === "secretary"

  return (
    <div className="flex flex-col gap-4">
      {/* Patient info card */}
      <div className="rounded-lg bg-gray-50 p-3 text-xs">
        <div className="mb-1 text-sm font-semibold">
          {patient.first_name} {patient.last_name}
        </div>
        <div className="flex justify-between text-gray-500">
          <span>DNI</span>
          <span className="font-medium text-gray-700">
            {patient.dni ?? "—"}
          </span>
        </div>
        {patient.phone && (
          <div className="flex justify-between text-gray-500">
            <span>Phone</span>
            <span className="font-medium text-gray-700">{patient.phone}</span>
          </div>
        )}
        {patient.insurance_provider && (
          <div className="flex justify-between text-gray-500">
            <span>Insurance</span>
            <span className="font-medium text-gray-700">
              {patient.insurance_provider}
              {patient.insurance_plan && ` ${patient.insurance_plan}`}
            </span>
          </div>
        )}
        <div className="flex justify-between text-gray-500">
          <span>No-shows</span>
          <span className="font-medium text-gray-700">
            {patient.no_show_count ?? 0}
          </span>
        </div>
      </div>

      {/* Appointment info */}
      <div className="text-xs text-gray-500">
        <div className="mb-1">
          <span className="font-semibold text-gray-900">
            Dr. {doctor.staff?.last_name || "Unknown"}
          </span>
          {" — "}
          {doctor.specialty || "General"}
        </div>
        <div>
          {format(new Date(appointment.appointment_date + "T12:00:00"), "EEE, MMM d, yyyy")}
          {" · "}
          {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
        </div>
        <div>
          {appointment.reason || "Appointment"}
          {" · "}
          <span className="font-medium" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* ── Primary action buttons ──────────────────────────────── */}
      {/* Only show buttons for transitions that are valid from the current status */}

      {isAdminOrSecretary && (
        <div className="flex flex-col gap-2">
          {/* Arrived — only if confirmed */}
          {availableTransitions.includes("arrived") && (
            <Button
              onClick={() => handleStatusChange("arrived")}
              disabled={updateStatus.isPending}
              className="w-full bg-green-500 shadow-none hover:bg-green-600"
            >
              Arrived
            </Button>
          )}

          {/* Start consultation + No show — row */}
          <div className="flex gap-2">
            {/* Start consultation — if arrived */}
            {availableTransitions.includes("in_progress") && (
              <Button
                onClick={() => handleStatusChange("in_progress")}
                disabled={updateStatus.isPending}
                className="flex-1 bg-green-700 shadow-none hover:bg-green-800"
              >
                Start consultation
              </Button>
            )}

            {/* No show — if confirmed or arrived */}
            {availableTransitions.includes("no_show") && (
              <Button
                onClick={() => handleStatusChange("no_show")}
                disabled={updateStatus.isPending}
                className="flex-1 bg-red-500 shadow-none hover:bg-red-600"
              >
                No show
              </Button>
            )}
          </div>

          {/* Complete — if in_progress */}
          {availableTransitions.includes("completed") && (
            <Button
              onClick={() => handleStatusChange("completed")}
              disabled={updateStatus.isPending}
              className="w-full bg-blue-700 shadow-none hover:bg-blue-800"
            >
              Complete consultation
            </Button>
          )}
        </div>
      )}

      {/* ── Secondary actions ───────────────────────────────────── */}
      {isAdminOrSecretary && availableTransitions.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-[#e5e5e5] text-xs shadow-none"
            size="sm"
            onClick={() => setShowRescheduleForm(true)}
          >
            Reschedule
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-xs text-red-500 shadow-none hover:bg-red-50"
            size="sm"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* ── Cancel confirmation ──────────────────────────────────── */}
      {showCancelConfirm && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="mb-2 text-xs font-semibold text-red-600">
            Cancel this appointment?
          </div>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation..."
            className="mb-2 w-full rounded-md border border-red-200 bg-white p-2 text-xs"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCancelConfirm}
              disabled={updateStatus.isPending}
              className="flex-1 bg-red-500 text-xs shadow-none hover:bg-red-600"
              size="sm"
            >
              Confirm cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(false)}
              className="flex-1 border-[#e5e5e5] text-xs shadow-none"
              size="sm"
            >
              Keep appointment
            </Button>
          </div>
        </div>
      )}

      {/* ── Reschedule form ─────────────────────────────────────── */}
      {showRescheduleForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="mb-2 text-xs font-semibold text-blue-600">
            Reschedule to:
          </div>
          <div className="mb-2 flex gap-2">
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="flex-1 rounded-md border border-blue-200 bg-white p-2 text-xs"
            />
            <input
              type="time"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              className="w-24 rounded-md border border-blue-200 bg-white p-2 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!rescheduleDate || !rescheduleTime) {
                  toast.error("Select date and time")
                  return
                }
                rescheduleAppointment.mutate(
                  {
                    clinic_id: clinicId,
                    new_date: rescheduleDate,
                    new_start_time: rescheduleTime,
                  },
                  {
                    onSuccess: () => {
                      toast.success("Appointment rescheduled")
                      onClose()
                    },
                    onError: (err) => toast.error(err.message),
                  }
                )
              }}
              disabled={rescheduleAppointment.isPending}
              className="flex-1 bg-blue-500 text-xs shadow-none hover:bg-blue-600"
              size="sm"
            >
              {rescheduleAppointment.isPending ? "Rescheduling..." : "Confirm"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRescheduleForm(false)}
              className="flex-1 border-[#e5e5e5] text-xs shadow-none"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Notes ───────────────────────────────────────────────── */}
      {appointment.internal_notes && (
        <div className="border-t border-[#f1f5f9] pt-3">
          <div className="mb-1 text-[11px] font-medium text-gray-500">Notes</div>
          <div className="text-[11px] text-gray-400">
            {appointment.internal_notes}
          </div>
        </div>
      )}

      {/* Link to full patient record */}
      <a
        href={`/patients/${patient.id}`}
        className="text-xs text-blue-500 hover:underline"
      >
        View full patient record →
      </a>
    </div>
  )
}
