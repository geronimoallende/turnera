/**
 * InlinePatientForm — Quick patient registration inside the booking flow.
 *
 * When the secretary searches for a patient and they don't exist,
 * she clicks "+ New patient" and this form appears INSIDE the booking panel.
 * She fills DNI + name (required), optionally phone, and continues booking.
 *
 * This does NOT call the API directly — it just collects the data and passes
 * it up to the BookingForm via onSubmit. The BookingForm then sends both
 * the patient data and the appointment data together to POST /api/appointments.
 *
 * Only DNI + first name + last name are required. Everything else can be
 * completed later in the Patients section.
 */

"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type InlinePatientFormProps = {
  // Called when the secretary fills the form and clicks "Continue"
  onSubmit: (patient: {
    dni: string
    first_name: string
    last_name: string
    phone?: string
  }) => void
  // Called when the secretary clicks "Cancel" to go back to search
  onCancel: () => void
}

export function InlinePatientForm({ onSubmit, onCancel }: InlinePatientFormProps) {
  // Form state — each field gets its own useState
  const [dni, setDni] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")

  // Simple validation — are all required fields filled?
  const isValid = dni.trim().length > 0 && firstName.trim().length > 0 && lastName.trim().length > 0

  function handleSubmit() {
    if (!isValid) return
    onSubmit({
      dni: dni.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || undefined,
    })
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-green-700">New patient</span>
        <button
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>

      {/* DNI — required */}
      <div className="mb-2">
        <Label className="text-[11px] text-gray-600">
          DNI <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          placeholder="12345678"
          className="mt-0.5 h-8 border-[#e5e5e5] text-xs shadow-none"
        />
      </div>

      {/* First name + Last name — side by side, both required */}
      <div className="mb-2 flex gap-2">
        <div className="flex-1">
          <Label className="text-[11px] text-gray-600">
            First name <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-0.5 h-8 border-[#e5e5e5] text-xs shadow-none"
          />
        </div>
        <div className="flex-1">
          <Label className="text-[11px] text-gray-600">
            Last name <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-0.5 h-8 border-[#e5e5e5] text-xs shadow-none"
          />
        </div>
      </div>

      {/* Phone — optional */}
      <div className="mb-3">
        <Label className="text-[11px] text-gray-600">Phone (optional)</Label>
        <Input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+54 9 351..."
          className="mt-0.5 h-8 border-[#e5e5e5] text-xs shadow-none"
        />
      </div>

      {/* Note */}
      <p className="mb-3 text-[10px] text-gray-400">
        Complete profile later in Patients section
      </p>

      {/* Continue button — disabled if required fields are empty */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full bg-green-600 text-xs shadow-none hover:bg-green-700 disabled:opacity-50"
        size="sm"
      >
        Continue with booking
      </Button>
    </div>
  )
}
