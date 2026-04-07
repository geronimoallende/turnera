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

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// ─── Validation Schemas ──────────────────────────────────────────

/** Schema for the create form — required: name + DNI, rest optional */
export const createPatientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dni: z.string().min(1, "DNI is required"),
  phone: z.string().optional(),
  whatsapp_same: z.boolean().optional(),
  whatsapp_phone: z.string().optional(),
  email: z.email("Invalid email").optional().or(z.literal("")),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_plan: z.string().optional(),
  insurance_member_number: z.string().optional(),
  notes: z.string().optional(),
})

/** Schema for the edit form (all fields) */
export const editPatientSchema = z.object({
  // Patient identity
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dni: z.string().optional(), // Editable — DNI can be corrected by staff
  phone: z.string().nullable().optional(),
  email: z.email("Invalid email").nullable().optional().or(z.literal("")),
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
    control, // Needed by useWatch to observe field values
    formState: { errors }, // Contains field-level error messages
  } = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: { whatsapp_same: true },
  })

  // Watch the "same number" checkbox — when checked, hide the WhatsApp field
  const whatsappSame = useWatch({ control, name: "whatsapp_same" })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Section 1: Identity (required) ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Identity
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="space-y-1.5">
            <Label htmlFor="date_of_birth" className="text-sm text-[#1a1a1a]">
              Date of birth
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              {...register("date_of_birth")}
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gender" className="text-sm text-[#1a1a1a]">
              Gender
            </Label>
            <select
              id="gender"
              {...register("gender")}
              className="flex h-9 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-1 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
            >
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 2: Contact ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Contact
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm text-[#1a1a1a]">
              Phone
            </Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+54 9 351..."
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-[#1a1a1a]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* WhatsApp — same as phone by default */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="whatsapp_same"
            {...register("whatsapp_same")}
            className="h-4 w-4 rounded border-[#e5e5e5] text-blue-500 focus:ring-blue-500"
          />
          <Label htmlFor="whatsapp_same" className="text-sm text-[#1a1a1a]">
            WhatsApp is the same as phone
          </Label>
        </div>

        {/* Only show separate WhatsApp field when checkbox is unchecked */}
        {!whatsappSame && (
          <div className="space-y-1.5">
            <Label htmlFor="whatsapp_phone" className="text-sm text-[#1a1a1a]">
              WhatsApp number
            </Label>
            <Input
              id="whatsapp_phone"
              {...register("whatsapp_phone")}
              placeholder="+54 9 351..."
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* ── Section 3: Insurance ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Insurance
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="insurance_provider" className="text-sm text-[#1a1a1a]">
              Insurance provider
            </Label>
            <Input
              id="insurance_provider"
              {...register("insurance_provider")}
              placeholder="OSDE, Swiss Medical, Galeno..."
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="insurance_plan" className="text-sm text-[#1a1a1a]">
              Plan
            </Label>
            <Input
              id="insurance_plan"
              {...register("insurance_plan")}
              placeholder="210, 310, 410..."
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="insurance_member_number" className="text-sm text-[#1a1a1a]">
              Member number
            </Label>
            <Input
              id="insurance_member_number"
              {...register("insurance_member_number")}
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ── Section 4: Notes ── */}
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-sm text-[#1a1a1a]">
          Notes
        </Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Internal notes..."
          className="min-h-[60px] border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
        />
      </div>

      {/* Error from API */}
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
