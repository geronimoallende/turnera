/**
 * SlotsPreview — date picker + slot chips grid.
 *
 * Allows checking availability for any date within the booking window.
 * Green chip = available slot, Gray chip = booked slot.
 * All roles can view this section.
 */

"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAvailableSlots } from "@/lib/hooks/use-doctors"

type Props = {
  doctorId: string
  clinicId: string
  /** How many days ahead to allow date selection. Defaults to 60. */
  maxBookingDaysAhead?: number
}

export function SlotsPreview({ doctorId, clinicId, maxBookingDaysAhead = 60 }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>("")
  const { data, isLoading, error } = useAvailableSlots(
    doctorId,
    clinicId,
    selectedDate || null
  )

  const slots = data?.data ?? []

  // Date range: today to +maxBookingDaysAhead days
  const today = new Date().toISOString().split("T")[0]
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + maxBookingDaysAhead)
  const maxDateStr = maxDate.toISOString().split("T")[0]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1a1a1a]">Slots Preview</h2>

      <div className="max-w-xs space-y-1.5">
        <Label className="text-sm text-[#1a1a1a]">Check date</Label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={today}
          max={maxDateStr}
          className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
        />
      </div>

      {!selectedDate && (
        <p className="text-sm text-gray-400">
          Select a date to preview available time slots.
        </p>
      )}

      {selectedDate && isLoading && (
        <p className="text-sm text-gray-500">Loading slots...</p>
      )}

      {selectedDate && error && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}

      {selectedDate && !isLoading && !error && slots.length === 0 && (
        <p className="text-sm text-gray-500">
          No slots configured for this date.
        </p>
      )}

      {selectedDate && !isLoading && slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <div
              key={slot.slot_start}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                slot.is_available
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-gray-200 bg-gray-100 text-gray-500"
              }`}
            >
              {slot.slot_start.slice(0, 5)} - {slot.slot_end.slice(0, 5)}
              {!slot.is_available && (
                <span className="ml-1.5 text-gray-400">Booked</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
