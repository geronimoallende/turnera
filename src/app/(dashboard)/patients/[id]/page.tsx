/**
 * Edit Patient Page — /patients/[id]
 *
 * Shows the full patient form with all fields in one flat structure.
 * All data lives in `clinic_patients` directly — no nested objects.
 *
 * The [id] in the folder name is a dynamic segment — Next.js extracts
 * the clinic_patients UUID from the URL. For example, /patients/abc-123
 * gives us params.id = "abc-123".
 *
 * Data flow:
 * 1. usePatient() fetches data from GET /api/patients/[id]?clinic_id=xxx
 * 2. Data pre-fills the form via defaultValues
 * 3. On submit, useUpdatePatient() sends PUT /api/patients/[id]
 * 4. After success, navigates back to the patient list
 *
 * "use client" because it uses hooks (useParams, usePatient, useUpdatePatient)
 */

"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useClinic } from "@/providers/clinic-provider"
import { usePatient, useUpdatePatient } from "@/lib/hooks/use-patients"
import {
  EditPatientForm,
  type EditPatientFormData,
} from "@/components/patients/patient-form"
import { ArrowLeft } from "lucide-react"

export default function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // In Next.js 15+, params is a Promise — use React's use() to unwrap it
  const { id } = use(params)
  const router = useRouter()
  const { activeClinicId } = useClinic()

  // Fetch the patient's current data
  const { data, isLoading, error } = usePatient(id, activeClinicId)
  const updatePatient = useUpdatePatient(id)

  function handleSubmit(formData: EditPatientFormData) {
    if (!activeClinicId) return

    // All fields go flat to the API — everything lives in clinic_patients
    updatePatient.mutate(
      {
        clinic_id: activeClinicId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        dni: formData.dni || null,
        phone: formData.phone || null,
        email: formData.email || null,
        whatsapp_phone: formData.whatsapp_phone || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        blood_type: formData.blood_type || null,
        allergies: formData.allergies || null,
        insurance_provider: formData.insurance_provider || null,
        insurance_plan: formData.insurance_plan || null,
        insurance_member_number: formData.insurance_member_number || null,
        notes: formData.notes || null,
      },
      {
        onSuccess: () => {
          router.push("/patients")
        },
      }
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-gray-500">
        Loading patient...
      </div>
    )
  }

  // Error state
  if (error || !data?.data) {
    return (
      <div className="space-y-4">
        <Link
          href="/patients"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to patients
        </Link>
        <div className="rounded-md border border-[#e5e5e5] bg-white p-8 text-center text-sm text-red-600">
          {error?.message || "Patient not found"}
        </div>
      </div>
    )
  }

  // Extract patient data for the form's defaultValues
  // The API returns flat data — all fields directly on the response object
  const patient = data.data
  const defaultValues: EditPatientFormData = {
    first_name: patient.first_name,
    last_name: patient.last_name,
    dni: patient.dni ?? "",
    phone: patient.phone,
    email: patient.email,
    whatsapp_phone: patient.whatsapp_phone,
    date_of_birth: patient.date_of_birth,
    gender: patient.gender,
    blood_type: patient.blood_type,
    allergies: patient.allergies,
    insurance_provider: patient.insurance_provider,
    insurance_plan: patient.insurance_plan,
    insurance_member_number: patient.insurance_member_number,
    notes: patient.notes,
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Back link */}
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patients
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">
          {patient.last_name}, {patient.first_name}
        </h1>
        {/* Show blacklist badge if applicable */}
        {patient.blacklist_status === "blacklisted" && (
          <span className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600">
            Blacklisted
          </span>
        )}
        {patient.blacklist_status === "warned" && (
          <span className="rounded bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-600">
            Warned
          </span>
        )}
      </div>

      {/* The form — pre-filled with current data */}
      <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
        <EditPatientForm
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={updatePatient.isPending}
          error={updatePatient.error?.message}
        />
      </div>
    </div>
  )
}
