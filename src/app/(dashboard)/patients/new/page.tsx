/**
 * Create Patient Page — /patients/new
 *
 * Shows a minimal form with 4 fields: first name, last name, DNI, phone.
 * On submit, it calls the POST /api/patients endpoint, which:
 * 1. Checks if DNI already exists at this clinic → shows error if duplicate
 * 2. Creates a new row in clinic_patients
 *
 * After success, navigates back to the patient list.
 */

"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useClinic } from "@/providers/clinic-provider"
import { useCreatePatient } from "@/lib/hooks/use-patients"
import {
  CreatePatientForm,
  type CreatePatientFormData,
} from "@/components/patients/patient-form"
import { ArrowLeft } from "lucide-react"

export default function NewPatientPage() {
  const router = useRouter()
  const { activeClinicId } = useClinic()
  const createPatient = useCreatePatient()

  function handleSubmit(data: CreatePatientFormData) {
    if (!activeClinicId) return

    // mutate() triggers the mutation function defined in useCreatePatient
    // It sends a POST request to /api/patients with the form data + clinic_id
    createPatient.mutate(
      {
        first_name: data.first_name,
        last_name: data.last_name,
        dni: data.dni,
        phone: data.phone,
        whatsapp_enabled: data.whatsapp_enabled,
        insurance_provider: data.insurance_provider,
        insurance_plan: data.insurance_plan,
        insurance_member_number: data.insurance_member_number,
        clinic_id: activeClinicId,
      },
      {
        // onSuccess runs ONLY if the mutation succeeds
        onSuccess: () => {
          router.push("/patients")
        },
      }
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Back link */}
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patients
      </Link>

      <h1 className="text-2xl font-semibold text-[#1a1a1a]">New Patient</h1>

      {/* The form component handles validation and field rendering */}
      <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
        <CreatePatientForm
          onSubmit={handleSubmit}
          isSubmitting={createPatient.isPending}
          error={createPatient.error?.message}
        />
      </div>
    </div>
  )
}
