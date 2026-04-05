/**
 * AppointmentSidePanel — Sliding panel on the right side of the calendar.
 *
 * This is a container that renders either:
 *   - BookingForm (when clicking an empty slot → mode="new")
 *   - AppointmentDetail (when clicking an appointment block → mode="detail")
 *
 * The panel is 360px wide and has a subtle shadow on the left edge.
 * It's conditionally rendered by the calendar page (not always visible).
 */

"use client"

import { BookingForm } from "./booking-form"
import { AppointmentDetail } from "./appointment-detail"

type AppointmentSidePanelProps = {
  mode: "new" | "detail"
  appointmentId: string | null
  slotInfo: { start: Date; end: Date; doctorId: string } | null
  clinicId: string | null
  role: string | null
  doctorName?: string
  doctors?: Array<{ id: string; full_name: string }>
  onClose: () => void
}

export function AppointmentSidePanel({
  mode,
  appointmentId,
  slotInfo,
  clinicId,
  role,
  doctorName,
  doctors,
  onClose,
}: AppointmentSidePanelProps) {
  if (!clinicId) return null

  return (
    <div className="flex w-[360px] shrink-0 flex-col border-l border-[#e5e5e5] bg-white shadow-[-2px_0_8px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-3">
        <h3 className="text-sm font-semibold">
          {mode === "new" ? "New appointment" : "Appointment detail"}
        </h3>
        <button
          onClick={onClose}
          className="text-lg text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Content — scrollable if it overflows */}
      <div className="flex-1 overflow-y-auto p-4">
        {mode === "new" && (
          <BookingForm
            clinicId={clinicId}
            slotInfo={slotInfo}
            doctorName={doctorName}
            doctors={doctors}
            onClose={onClose}
          />
        )}

        {mode === "detail" && appointmentId && (
          <AppointmentDetail
            appointmentId={appointmentId}
            clinicId={clinicId}
            role={role}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}
