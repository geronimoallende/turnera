/**
 * Add Doctor Page — /doctors/new
 *
 * Two-tab interface for admins to add doctors to their clinic:
 *
 * Tab 1: "New Doctor" — creates a brand-new doctor who doesn't exist
 *   in the system yet. Creates auth user + staff + doctors + settings.
 *
 * Tab 2: "Existing Doctor" — links a doctor who's already in the system
 *   (e.g., works at another clinic). Search by email → see partial info
 *   (masked name for privacy) → confirm link.
 *
 * Only admins see this page (enforced by the API routes too).
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft, UserPlus, Link as LinkIcon, Search, CheckCircle2, AlertCircle } from "lucide-react"
import { useClinic } from "@/providers/clinic-provider"
import {
  useCreateDoctor,
  useLookupDoctor,
  useLinkDoctor,
  type LookupDoctorResult,
} from "@/lib/hooks/use-doctors"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ─── Validation Schemas ─────────────────────────────────────────

const createDoctorSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  license_number: z.string().optional(),
  slot_duration: z.number().int().min(5).max(120),
  fee: z.number().min(0),
})

const lookupSchema = z.object({
  email: z.string().email("Valid email is required"),
})

type CreateDoctorFormData = z.infer<typeof createDoctorSchema>
type LookupFormData = z.infer<typeof lookupSchema>

// ─── Input field class ──────────────────────────────────────────

const inputClass = "border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"

// ─── Page Component ─────────────────────────────────────────────

export default function NewDoctorPage() {
  const router = useRouter()
  const { activeClinicId, activeRole } = useClinic()

  // Show nothing if not admin
  if (activeRole !== "admin") {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <p className="text-sm text-red-600">Only admins can add doctors.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Back link */}
      <Link
        href="/doctors"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to doctors
      </Link>

      <h1 className="text-2xl font-semibold text-[#1a1a1a]">Add Doctor</h1>

      {/* Two tabs: New Doctor vs Existing Doctor */}
      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            New Doctor
          </TabsTrigger>
          <TabsTrigger value="existing" className="gap-1.5">
            <LinkIcon className="h-4 w-4" />
            Existing Doctor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
            <p className="mb-4 text-sm text-gray-500">
              Create a new account for a doctor who has never used Turnera before.
              They will be able to log in with the email and password you set.
            </p>
            <CreateDoctorForm
              clinicId={activeClinicId!}
              onSuccess={() => router.push("/doctors")}
            />
          </div>
        </TabsContent>

        <TabsContent value="existing">
          <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
            <p className="mb-4 text-sm text-gray-500">
              Link a doctor who already has a Turnera account at another clinic.
              Search by their email to find them.
            </p>
            <LinkDoctorFlow
              clinicId={activeClinicId!}
              onSuccess={() => router.push("/doctors")}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Create Doctor Form ─────────────────────────────────────────

function CreateDoctorForm({
  clinicId,
  onSuccess,
}: {
  clinicId: string
  onSuccess: () => void
}) {
  const createDoctor = useCreateDoctor()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDoctorFormData>({
    resolver: zodResolver(createDoctorSchema),
    defaultValues: {
      slot_duration: 30,
      fee: 0,
    },
  })

  function onSubmit(data: CreateDoctorFormData) {
    createDoctor.mutate(
      { ...data, clinic_id: clinicId },
      { onSuccess }
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name row — two columns on desktop */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="first_name" className="text-sm text-[#1a1a1a]">
            First name *
          </Label>
          <Input id="first_name" {...register("first_name")} className={inputClass} />
          {errors.first_name && (
            <p className="text-xs text-red-600">{errors.first_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name" className="text-sm text-[#1a1a1a]">
            Last name *
          </Label>
          <Input id="last_name" {...register("last_name")} className={inputClass} />
          {errors.last_name && (
            <p className="text-xs text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm text-[#1a1a1a]">
          Email *
        </Label>
        <Input id="email" type="email" {...register("email")} className={inputClass} />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm text-[#1a1a1a]">
          Password *
        </Label>
        <Input id="password" type="password" {...register("password")} className={inputClass} />
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
        <p className="text-xs text-gray-400">
          The doctor will use this to log in. Minimum 8 characters.
        </p>
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-sm text-[#1a1a1a]">
          Phone
        </Label>
        <Input id="phone" {...register("phone")} className={inputClass} />
      </div>

      {/* Specialty + License row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="specialty" className="text-sm text-[#1a1a1a]">
            Specialty
          </Label>
          <Input
            id="specialty"
            placeholder="e.g. Cardiology"
            {...register("specialty")}
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="license_number" className="text-sm text-[#1a1a1a]">
            License number
          </Label>
          <Input
            id="license_number"
            placeholder="Medical license"
            {...register("license_number")}
            className={inputClass}
          />
        </div>
      </div>

      {/* Clinic settings row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="slot_duration" className="text-sm text-[#1a1a1a]">
            Slot duration (minutes)
          </Label>
          <Input
            id="slot_duration"
            type="number"
            {...register("slot_duration", { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.slot_duration && (
            <p className="text-xs text-red-600">{errors.slot_duration.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fee" className="text-sm text-[#1a1a1a]">
            Consultation fee
          </Label>
          <Input
            id="fee"
            type="number"
            step="0.01"
            {...register("fee", { valueAsNumber: true })}
            className={inputClass}
          />
        </div>
      </div>

      {/* API error */}
      {createDoctor.error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-600">{createDoctor.error.message}</p>
        </div>
      )}

      {/* Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={createDoctor.isPending}
          className="w-full bg-blue-500 shadow-none hover:bg-blue-600"
        >
          {createDoctor.isPending ? "Creating..." : "Create Doctor"}
        </Button>
      </div>
    </form>
  )
}

// ─── Link Existing Doctor Flow ──────────────────────────────────
//
// Two-step flow:
// Step 1: Search by email → see partial info (masked name)
// Step 2: Configure slot duration + fee → click "Link to my clinic"

function LinkDoctorFlow({
  clinicId,
  onSuccess,
}: {
  clinicId: string
  onSuccess: () => void
}) {
  const lookupDoctor = useLookupDoctor()
  const linkDoctor = useLinkDoctor()

  // Step tracking: null = search step, LookupDoctorResult = confirm step
  const [found, setFound] = useState<LookupDoctorResult | null>(null)

  // Lookup form
  const {
    register: registerLookup,
    handleSubmit: handleLookupSubmit,
    formState: { errors: lookupErrors },
  } = useForm<LookupFormData>({
    resolver: zodResolver(lookupSchema),
  })

  // Link settings form (appears after lookup succeeds)
  const {
    register: registerLink,
    handleSubmit: handleLinkSubmit,
  } = useForm({
    defaultValues: { slot_duration: 30, fee: 0 },
  })

  function onLookup(data: LookupFormData) {
    setFound(null)
    lookupDoctor.mutate(
      { email: data.email, clinic_id: clinicId },
      {
        onSuccess: (result) => {
          setFound(result.data)
        },
      }
    )
  }

  function onLink(data: { slot_duration: number; fee: number }) {
    if (!found) return
    linkDoctor.mutate(
      {
        doctor_id: found.doctor_id,
        clinic_id: clinicId,
        slot_duration: Number(data.slot_duration),
        fee: Number(data.fee),
      },
      { onSuccess }
    )
  }

  return (
    <div className="space-y-4">
      {/* Step 1: Search by email */}
      <form onSubmit={handleLookupSubmit(onLookup)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lookup_email" className="text-sm text-[#1a1a1a]">
            Doctor&apos;s email *
          </Label>
          <div className="flex gap-2">
            <Input
              id="lookup_email"
              type="email"
              placeholder="doctor@example.com"
              {...registerLookup("email")}
              className={inputClass + " flex-1"}
            />
            <Button
              type="submit"
              disabled={lookupDoctor.isPending}
              className="shrink-0 bg-blue-500 shadow-none hover:bg-blue-600"
            >
              <Search className="mr-1.5 h-4 w-4" />
              {lookupDoctor.isPending ? "Searching..." : "Search"}
            </Button>
          </div>
          {lookupErrors.email && (
            <p className="text-xs text-red-600">{lookupErrors.email.message}</p>
          )}
        </div>
      </form>

      {/* Lookup error */}
      {lookupDoctor.error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-600">{lookupDoctor.error.message}</p>
        </div>
      )}

      {/* Step 2: Show found doctor + link form */}
      {found && (
        <div className="space-y-4">
          {/* Doctor info card */}
          <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">
                {found.display_name}
              </p>
              <p className="text-xs text-gray-500">
                {found.specialty || "No specialty set"}
              </p>
            </div>
          </div>

          {/* Already linked warning */}
          {found.already_linked ? (
            <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                This doctor is already linked to your clinic.
              </p>
            </div>
          ) : (
            /* Link settings form */
            <form onSubmit={handleLinkSubmit(onLink)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="link_slot_duration" className="text-sm text-[#1a1a1a]">
                    Slot duration (minutes)
                  </Label>
                  <Input
                    id="link_slot_duration"
                    type="number"
                    {...registerLink("slot_duration")}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="link_fee" className="text-sm text-[#1a1a1a]">
                    Consultation fee
                  </Label>
                  <Input
                    id="link_fee"
                    type="number"
                    step="0.01"
                    {...registerLink("fee")}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Link error */}
              {linkDoctor.error && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-sm text-red-600">{linkDoctor.error.message}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={linkDoctor.isPending}
                className="w-full bg-blue-500 shadow-none hover:bg-blue-600"
              >
                <LinkIcon className="mr-1.5 h-4 w-4" />
                {linkDoctor.isPending ? "Linking..." : "Link to my clinic"}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
