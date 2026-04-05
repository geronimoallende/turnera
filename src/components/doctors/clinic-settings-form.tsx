/**
 * ClinicSettingsForm — per-clinic doctor configuration.
 *
 * Fields: Default Slot Duration, Max Daily Appointments, Consultation Fee,
 *         Allows Overbooking (toggle), Max Overbooking Slots (visible if overbooking on).
 *
 * Only admin can edit. Doctors and secretaries see this as read-only.
 */

"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const settingsSchema = z.object({
  default_slot_duration_minutes: z.number().int().min(5).max(120),
  max_daily_appointments: z.number().int().min(1).nullable().optional(),
  consultation_fee: z.number().min(0).nullable().optional(),
  allows_overbooking: z.boolean(),
  max_overbooking_slots: z.number().int().min(1).nullable().optional(),
  can_create_appointments: z.boolean(),
  can_cancel_appointments: z.boolean(),
})

export type ClinicSettingsFormData = z.infer<typeof settingsSchema>

type Props = {
  defaultValues: ClinicSettingsFormData
  canEdit: boolean
  onSubmit: (data: ClinicSettingsFormData) => void
  isSubmitting: boolean
  error?: string | null
}

export function ClinicSettingsForm({
  defaultValues,
  canEdit,
  onSubmit,
  isSubmitting,
  error,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ClinicSettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  })

  // Watch the overbooking toggle to show/hide max_overbooking_slots
  const allowsOverbooking = useWatch({ control, name: "allows_overbooking" })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1a1a1a]">Clinic Settings</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Default Slot Duration (min)</Label>
          <select
            {...register("default_slot_duration_minutes", { valueAsNumber: true })}
            disabled={!canEdit}
            className="flex h-9 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            {[15, 20, 30, 45, 60].map((min) => (
              <option key={min} value={min}>
                {min} min
              </option>
            ))}
          </select>
          {errors.default_slot_duration_minutes && (
            <p className="text-xs text-red-600">
              {errors.default_slot_duration_minutes.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Max Daily Appointments</Label>
          <Input
            type="number"
            {...register("max_daily_appointments", { valueAsNumber: true })}
            disabled={!canEdit}
            placeholder="Unlimited"
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Consultation Fee ($)</Label>
          <Input
            type="number"
            step="0.01"
            {...register("consultation_fee", { valueAsNumber: true })}
            disabled={!canEdit}
            placeholder="0.00"
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="allows_overbooking"
            {...register("allows_overbooking")}
            disabled={!canEdit}
            className="h-4 w-4 rounded border-[#e5e5e5] text-blue-500 focus:ring-blue-500"
          />
          <Label htmlFor="allows_overbooking" className="text-sm text-[#1a1a1a]">
            Allows Overbooking
          </Label>
        </div>

        {allowsOverbooking && (
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">Max Overbooking Slots</Label>
            <Input
              type="number"
              {...register("max_overbooking_slots", { valueAsNumber: true })}
              disabled={!canEdit}
              placeholder="1"
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* Doctor appointment permissions — only visible to admin */}
      {canEdit && (
        <div className="space-y-3 border-t border-[#e5e5e5] pt-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a]">
            Appointment Permissions
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="can_create_appointments"
              {...register("can_create_appointments")}
              className="h-4 w-4 rounded border-[#e5e5e5] text-blue-500 focus:ring-blue-500"
            />
            <Label
              htmlFor="can_create_appointments"
              className="text-sm text-[#1a1a1a]"
            >
              Can create appointments
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="can_cancel_appointments"
              {...register("can_cancel_appointments")}
              className="h-4 w-4 rounded border-[#e5e5e5] text-blue-500 focus:ring-blue-500"
            />
            <Label
              htmlFor="can_cancel_appointments"
              className="text-sm text-[#1a1a1a]"
            >
              Can cancel/reschedule appointments
            </Label>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {canEdit && (
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 shadow-none hover:bg-blue-600"
        >
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      )}
    </form>
  )
}
