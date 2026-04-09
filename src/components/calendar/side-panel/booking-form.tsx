/**
 * BookingForm — The form for creating a new appointment.
 *
 * Appears when the secretary clicks an empty time slot in the calendar.
 * Pre-fills the doctor, date, and time from the clicked slot.
 *
 * Flow:
 *   1. Secretary types DNI → PatientSearch shows matches
 *   2. Secretary selects a patient (or creates new via InlinePatientForm)
 *   3. Secretary picks consultation type and duration (pre-filled)
 *   4. Secretary clicks "Book appointment"
 *   5. useCreateAppointment sends POST /api/appointments
 *   6. On success → calendar refetches → new block appears → panel closes
 */

"use client"

import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateAppointment } from "@/lib/hooks/use-appointments"
import { useDoctorSchedulesForDate } from "@/lib/hooks/use-doctors"
import { PatientSearch } from "./patient-search"
import { InlinePatientForm } from "./inline-patient-form"
import {
  CONSULTATION_TYPES,
  DURATION_OPTIONS,
} from "@/lib/constants/appointment-status"
import type { PatientListItem } from "@/lib/hooks/use-patients"

type BookingFormProps = {
  clinicId: string
  // Pre-filled from the clicked slot (null if "+ New appointment" clicked)
  slotInfo: {
    start: Date
    end: Date
    doctorId: string
  } | null
  // Doctor info for display
  doctorName?: string
  // All doctors at this clinic (for manual doctor selection when no slot clicked)
  doctors?: Array<{ id: string; full_name: string }>
  // Called when the booking is complete or the user cancels
  onClose: () => void
}

export function BookingForm({
  clinicId,
  slotInfo,
  doctorName,
  doctors = [],
  onClose,
}: BookingFormProps) {
  // ── State ────────────────────────────────────────────────────

  // Which patient is selected (or null if none yet)
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(
    null
  )
  // Is the inline "new patient" form showing?
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  // New patient data (if creating inline)
  const [newPatientData, setNewPatientData] = useState<{
    dni: string
    first_name: string
    last_name: string
    phone?: string
  } | null>(null)

  // Form fields
  const [consultationType, setConsultationType] = useState("consultation")
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [startTime, setStartTime] = useState(
    slotInfo ? format(slotInfo.start, "HH:mm") : "09:00"
  )
  const [notes, setNotes] = useState("")

  // Manual entry fields (used when no slot was clicked)
  const [manualDate, setManualDate] = useState(
    slotInfo ? format(slotInfo.start, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  )
  const [manualDoctorId, setManualDoctorId] = useState(
    slotInfo?.doctorId || doctors[0]?.id || ""
  )

  // The mutation hook — handles the API call
  const createAppointment = useCreateAppointment()

  // ── Schedule awareness ──────────────────────────────────────
  const selectedDate = slotInfo ? format(slotInfo.start, "yyyy-MM-dd") : manualDate
  const selectedDoctorId = slotInfo?.doctorId || manualDoctorId
  const { data: schedulesData } = useDoctorSchedulesForDate(clinicId, selectedDate)
  const doctorSchedule = selectedDoctorId ? schedulesData?.data?.[selectedDoctorId] : undefined

  const scheduleWarning = (() => {
    if (!selectedDoctorId || !schedulesData?.data) return null
    if (!doctorSchedule) return null
    if (doctorSchedule.is_blocked) {
      return { type: "blocked" as const, message: `Doctor not available${doctorSchedule.block_reason ? `: ${doctorSchedule.block_reason}` : ""}` }
    }
    if (doctorSchedule.blocks.length === 0) {
      return { type: "no-schedule" as const, message: "Doctor is not working this day" }
    }
    return null
  })()

  // ── Derived values ───────────────────────────────────────────

  // Do we have a patient (either selected or created inline)?
  const hasPatient = selectedPatient !== null || newPatientData !== null
  // Display name for the selected/created patient
  const patientDisplayName = selectedPatient
    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
    : newPatientData
      ? `${newPatientData.first_name} ${newPatientData.last_name}`
      : null

  // ── Handlers ─────────────────────────────────────────────────

  // Secretary selected an existing patient from search
  function handlePatientSelect(patient: PatientListItem) {
    setSelectedPatient(patient)
    setNewPatientData(null)
    setShowNewPatientForm(false)
  }

  // Secretary filled the inline new patient form
  function handleNewPatientSubmit(data: {
    dni: string
    first_name: string
    last_name: string
    phone?: string
  }) {
    setNewPatientData(data)
    setSelectedPatient(null)
    setShowNewPatientForm(false)
  }

  // Clear patient selection (go back to search)
  function clearPatient() {
    setSelectedPatient(null)
    setNewPatientData(null)
  }

  // ── Submit the booking ───────────────────────────────────────
  async function handleSubmit() {
    // Use slot info if available, otherwise use manual entry fields
    const doctorId = slotInfo?.doctorId || manualDoctorId
    const appointmentDate = slotInfo ? format(slotInfo.start, "yyyy-MM-dd") : manualDate

    if (!doctorId) {
      toast.error("Select a doctor")
      return
    }

    const appointmentData: Record<string, unknown> = {
      clinic_id: clinicId,
      doctor_id: doctorId,
      appointment_date: appointmentDate,
      start_time: startTime,
      duration_minutes: durationMinutes,
      reason: consultationType,
      internal_notes: notes || undefined,
    }

    // Either use existing patient ID or create new patient inline
    if (selectedPatient) {
      appointmentData.patient_id = selectedPatient.id
    } else if (newPatientData) {
      appointmentData.new_patient = newPatientData
    }

    // .mutate() calls the API. We use the callback form to handle success/error.
    createAppointment.mutate(appointmentData as Parameters<typeof createAppointment.mutate>[0], {
      onSuccess: () => {
        // Sonner toast = a small notification that appears at the bottom
        toast.success("Appointment booked")
        onClose()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Pre-filled slot info (when clicking an empty slot) */}
      {slotInfo && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600">
          <span className="font-semibold">{doctorName || "Doctor"}</span>
          <span className="text-blue-300">·</span>
          <span>{format(slotInfo.start, "EEE, MMM d")}</span>
          <span className="text-blue-300">·</span>
          <span>
            {format(slotInfo.start, "HH:mm")} - {format(slotInfo.end, "HH:mm")}
          </span>
        </div>
      )}

      {/* Manual entry (when clicking "+ New appointment" without a slot) */}
      {!slotInfo && (
        <div className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3">
          <div>
            <Label className="text-xs font-medium text-gray-600">Doctor</Label>
            <select
              value={manualDoctorId}
              onChange={(e) => setManualDoctorId(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#e5e5e5] bg-white px-3 py-2 text-sm"
            >
              <option value="">Select doctor...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-600">Date</Label>
            <Input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="mt-1 border-[#e5e5e5] shadow-none"
            />
          </div>
        </div>
      )}

      {/* Patient search or selected patient card */}
      {!hasPatient && !showNewPatientForm && (
        <PatientSearch
          clinicId={clinicId}
          onSelect={handlePatientSelect}
          onNewPatient={() => setShowNewPatientForm(true)}
        />
      )}

      {/* Inline new patient form */}
      {showNewPatientForm && (
        <InlinePatientForm
          onSubmit={handleNewPatientSubmit}
          onCancel={() => setShowNewPatientForm(false)}
        />
      )}

      {/* Schedule warning */}
      {scheduleWarning && (
        <div className={`rounded-lg px-3 py-2 text-xs ${
          scheduleWarning.type === "blocked" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
        }`}>
          {scheduleWarning.message}
        </div>
      )}
      {doctorSchedule && doctorSchedule.blocks.length > 0 && (
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Working hours: {doctorSchedule.blocks.map((b) => `${b.start_time.slice(0, 5)} - ${b.end_time.slice(0, 5)}`).join(", ")}
        </div>
      )}

      {/* Selected patient card — shows after selection */}
      {hasPatient && (
        <div>
          <Label className="text-xs font-medium text-gray-600">Patient</Label>
          <div className="mt-1 flex items-center justify-between rounded-lg border border-[#e5e5e5] bg-gray-50 px-3 py-2.5">
            <div>
              <div className="text-sm font-semibold">{patientDisplayName}</div>
              {selectedPatient && (
                <div className="text-[11px] text-gray-400">
                  DNI {selectedPatient.dni ?? "—"}
                  {selectedPatient.insurance_provider &&
                    ` · ${selectedPatient.insurance_provider}`}
                </div>
              )}
              {newPatientData && (
                <div className="text-[11px] text-gray-400">
                  DNI {newPatientData.dni} · New patient
                </div>
              )}
            </div>
            {/* X button to deselect and go back to search */}
            <button
              onClick={clearPatient}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Consultation type */}
      <div>
        <Label className="text-xs font-medium text-gray-600">
          Consultation type
        </Label>
        <select
          value={consultationType}
          onChange={(e) => setConsultationType(e.target.value)}
          className="mt-1 w-full rounded-md border border-[#e5e5e5] bg-white px-3 py-2 text-sm"
        >
          {CONSULTATION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Duration + Time — side by side */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs font-medium text-gray-600">Duration</Label>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-[#e5e5e5] bg-white px-3 py-2 text-sm"
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <Label className="text-xs font-medium text-gray-600">Time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 border-[#e5e5e5] shadow-none"
            min={doctorSchedule?.blocks?.[0]?.start_time?.slice(0, 5)}
            max={doctorSchedule?.blocks?.[doctorSchedule.blocks.length - 1]?.end_time?.slice(0, 5)}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-xs font-medium text-gray-600">
          Notes (optional)
        </Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes..."
          className="mt-1 resize-none border-[#e5e5e5] shadow-none"
          rows={2}
        />
      </div>

      {/* Book button */}
      <Button
        onClick={handleSubmit}
        disabled={!hasPatient || createAppointment.isPending}
        className="w-full bg-blue-500 shadow-none hover:bg-blue-600 disabled:opacity-50"
      >
        {createAppointment.isPending
          ? "Booking..."
          : newPatientData
            ? "Create patient & book"
            : "Book appointment"}
      </Button>
    </div>
  )
}
