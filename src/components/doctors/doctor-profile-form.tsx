/**
 * DoctorProfileForm — editable profile section on the doctor detail page.
 *
 * Fields: Full Name (first + last), Email (read-only), Phone, WhatsApp checkbox,
 * Specialty, License Number.
 * Save button only visible when canEdit is true (admin or the doctor themselves).
 */

"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().nullable().optional(),
  whatsapp_enabled: z.boolean(),
  specialty: z.string().nullable().optional(),
  license_number: z.string().nullable().optional(),
})

export type DoctorProfileFormData = z.infer<typeof profileSchema>

type Props = {
  defaultValues: DoctorProfileFormData
  email: string
  canEdit: boolean
  onSubmit: (data: DoctorProfileFormData) => void
  isSubmitting: boolean
  error?: string | null
}

export function DoctorProfileForm({
  defaultValues,
  email,
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
  } = useForm<DoctorProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold text-[#1a1a1a]">Profile</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">First name *</Label>
          <Input
            {...register("first_name")}
            disabled={!canEdit}
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
          {errors.first_name && (
            <p className="text-xs text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Last name *</Label>
          <Input
            {...register("last_name")}
            disabled={!canEdit}
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
          {errors.last_name && (
            <p className="text-xs text-red-600">{errors.last_name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Email</Label>
          <Input
            value={email}
            disabled
            className="border-[#e5e5e5] bg-gray-50 shadow-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Phone</Label>
          <Input
            {...register("phone")}
            disabled={!canEdit}
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Specialty</Label>
          <Input
            {...register("specialty")}
            disabled={!canEdit}
            placeholder="Cardiology, Dermatology, etc."
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">License Number</Label>
          <Input
            {...register("license_number")}
            disabled={!canEdit}
            className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
      </div>

      {/* WhatsApp checkbox — below the grid */}
      <Controller
        name="whatsapp_enabled"
        control={control}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <Checkbox
              id="doctor_whatsapp_enabled"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={!canEdit}
            />
            <Label
              htmlFor="doctor_whatsapp_enabled"
              className="text-sm text-gray-600 cursor-pointer"
            >
              This phone has WhatsApp
            </Label>
          </div>
        )}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {canEdit && (
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 shadow-none hover:bg-blue-600"
        >
          {isSubmitting ? "Saving..." : "Save Profile"}
        </Button>
      )}
    </form>
  )
}
