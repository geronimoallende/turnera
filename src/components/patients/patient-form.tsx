/**
 * PatientForm — reusable form for creating and editing patients.
 *
 * Used by two pages:
 * - /patients/new (create mode): shows only 4 fields
 * - /patients/[id] (edit mode): shows all fields, split into sections
 *
 * Why reusable? Because create and edit forms share the same fields,
 * validation, and submission logic. The only difference is:
 * - Create: fewer fields, POST request
 * - Edit: all fields, pre-filled with existing data, PUT request
 *
 * We use react-hook-form + zod:
 * - react-hook-form: manages form state (values, errors, submission)
 * - zod: defines validation rules (same library as the API routes)
 * - @hookform/resolvers: connects zod to react-hook-form
 *
 * How react-hook-form works:
 * 1. useForm() creates a form instance with register, handleSubmit, etc.
 * 2. register("fieldName") connects an <input> to the form
 * 3. handleSubmit(onSubmit) validates → if valid, calls onSubmit(data)
 * 4. formState.errors contains validation error messages
 */

"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// ─── Validation Schemas ──────────────────────────────────────────

/** Schema for the create form (minimal: 4 fields) */
export const createPatientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dni: z.string().min(1, "DNI is required"),
  phone: z.string().optional(),
})

/** Schema for the edit form (all fields) */
export const editPatientSchema = z.object({
  // Patient identity
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dni: z.string().optional(), // Editable — DNI can be corrected by staff
  phone: z.string().nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
  whatsapp_phone: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  blood_type: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  // Insurance & notes
  insurance_provider: z.string().nullable().optional(),
  insurance_plan: z.string().nullable().optional(),
  insurance_member_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

// Infer TypeScript types from the zod schemas
export type CreatePatientFormData = z.infer<typeof createPatientSchema>
export type EditPatientFormData = z.infer<typeof editPatientSchema>

// ─── Create Patient Form ─────────────────────────────────────────

type CreateFormProps = {
  onSubmit: (data: CreatePatientFormData) => void
  isSubmitting: boolean
  error?: string | null
}

export function CreatePatientForm({
  onSubmit,
  isSubmitting,
  error,
}: CreateFormProps) {
  // useForm sets up the form with zod validation
  const {
    register, // Connects inputs to the form
    handleSubmit, // Wraps onSubmit with validation
    formState: { errors }, // Contains field-level error messages
  } = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* First name */}
      <div className="space-y-1.5">
        <Label htmlFor="first_name" className="text-sm text-[#1a1a1a]">
          First name *
        </Label>
        <Input
          id="first_name"
          {...register("first_name")}
          className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
        />
        {errors.first_name && (
          <p className="text-xs text-red-600">{errors.first_name.message}</p>
        )}
      </div>

      {/* Last name */}
      <div className="space-y-1.5">
        <Label htmlFor="last_name" className="text-sm text-[#1a1a1a]">
          Last name *
        </Label>
        <Input
          id="last_name"
          {...register("last_name")}
          className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
        />
        {errors.last_name && (
          <p className="text-xs text-red-600">{errors.last_name.message}</p>
        )}
      </div>

      {/* DNI */}
      <div className="space-y-1.5">
        <Label htmlFor="dni" className="text-sm text-[#1a1a1a]">
          DNI *
        </Label>
        <Input
          id="dni"
          {...register("dni")}
          className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
        />
        {errors.dni && (
          <p className="text-xs text-red-600">{errors.dni.message}</p>
        )}
      </div>

      {/* Phone (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-sm text-[#1a1a1a]">
          Phone
        </Label>
        <Input
          id="phone"
          {...register("phone")}
          className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
        />
      </div>

      {/* Error from API (e.g., "Patient already registered") */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Submit button */}
      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 shadow-none hover:bg-blue-600"
        >
          {isSubmitting ? "Creating..." : "Create Patient"}
        </Button>
      </div>
    </form>
  )
}

// ─── Edit Patient Form ───────────────────────────────────────────

type EditFormProps = {
  defaultValues: EditPatientFormData
  onSubmit: (data: EditPatientFormData) => void
  isSubmitting: boolean
  error?: string | null
}

export function EditPatientForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  error,
}: EditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditPatientFormData>({
    resolver: zodResolver(editPatientSchema),
    // Pre-fill the form with existing patient data
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Section 1: Personal Info ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1a1a1a]">
          Personal Info
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* First name */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">First name *</Label>
            <Input
              {...register("first_name")}
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
            {errors.first_name && (
              <p className="text-xs text-red-600">
                {errors.first_name.message}
              </p>
            )}
          </div>

          {/* Last name */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">Last name *</Label>
            <Input
              {...register("last_name")}
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
            {errors.last_name && (
              <p className="text-xs text-red-600">
                {errors.last_name.message}
              </p>
            )}
          </div>

          {/* DNI (editable — staff can correct typos) */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">DNI</Label>
            <Input
              {...register("dni")}
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          {/* Date of birth */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">Date of birth</Label>
            <Input
              type="date"
              {...register("date_of_birth")}
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">Gender</Label>
            <Input
              {...register("gender")}
              placeholder="Male / Female / Other"
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">Phone</Label>
            <Input
              {...register("phone")}
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">Email</Label>
            <Input
              type="email"
              {...register("email")}
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">WhatsApp</Label>
            <Input
              {...register("whatsapp_phone")}
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          {/* Blood type */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">Blood type</Label>
            <Input
              {...register("blood_type")}
              placeholder="A+, B-, O+, etc."
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          {/* Allergies */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">Allergies</Label>
            <Input
              {...register("allergies")}
              placeholder="Penicillin, latex, etc."
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Insurance & Notes ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1a1a1a]">
          Insurance & Notes
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Insurance provider */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">
              Insurance provider
            </Label>
            <Input
              {...register("insurance_provider")}
              placeholder="OSDE, Swiss Medical, etc."
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          {/* Insurance plan */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">Insurance plan</Label>
            <Input
              {...register("insurance_plan")}
              placeholder="OSDE 210, etc."
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          {/* Member number */}
          <div className="space-y-1.5">
            <Label className="text-sm text-[#1a1a1a]">Member number</Label>
            <Input
              {...register("insurance_member_number")}
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* Notes (full width) */}
        <div className="space-y-1.5">
          <Label className="text-sm text-[#1a1a1a]">Notes</Label>
          <Textarea
            {...register("notes")}
            placeholder="Internal notes about this patient..."
            className="min-h-[80px] border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
          />
        </div>
      </div>

      {/* Error from API */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Submit button */}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 shadow-none hover:bg-blue-600"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}
