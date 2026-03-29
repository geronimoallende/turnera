/**
 * React Query hooks for patient data.
 *
 * These hooks are the bridge between the API routes and the UI.
 * They handle:
 * - Fetching data from /api/patients
 * - Caching responses (so navigating back doesn't re-fetch)
 * - Loading/error states
 * - Cache invalidation after mutations (create/update)
 *
 * How React Query works:
 * - useQuery("key", fetchFn) → calls fetchFn, caches result under "key"
 * - useMutation(mutationFn) → calls mutationFn on demand (not automatically)
 * - queryClient.invalidateQueries("key") → marks cache as stale → re-fetches
 *
 * Each hook returns an object with { data, isLoading, error, ... }
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ─── Types ───────────────────────────────────────────────────────
// These describe the shape of the API responses

/** A patient row as returned by the list endpoint */
export type PatientListItem = {
  id: string
  first_name: string
  last_name: string
  dni: string | null
  phone: string | null
  email: string | null
  whatsapp_phone: string | null
  is_active: boolean | null
  blacklist_status: string
  no_show_count: number
  insurance_provider: string | null
  insurance_plan: string | null
  tags: string[] | null
  notes: string | null
}

/** Pagination metadata from the list endpoint */
type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Response from GET /api/patients */
type PatientsListResponse = {
  data: PatientListItem[]
  pagination: Pagination
}

/** A full patient record as returned by the detail endpoint */
export type PatientDetail = {
  id: string
  first_name: string
  last_name: string
  dni: string | null
  phone: string | null
  email: string | null
  whatsapp_phone: string | null
  date_of_birth: string | null
  gender: string | null
  blood_type: string | null
  allergies: string | null
  is_active: boolean | null
  blacklist_status: string
  no_show_count: number
  insurance_provider: string | null
  insurance_plan: string | null
  insurance_member_number: string | null
  notes: string | null
  tags: string[] | null
  patient_type: string | null
  financial_status: string | null
}

/** Body for POST /api/patients (create) */
type CreatePatientInput = {
  first_name: string
  last_name: string
  dni: string
  phone?: string
  clinic_id: string
}

/** Body for PUT /api/patients/[id] (update) */
type UpdatePatientInput = {
  clinic_id: string
  first_name?: string
  last_name?: string
  dni?: string | null
  phone?: string | null
  email?: string | null
  whatsapp_phone?: string | null
  date_of_birth?: string | null
  gender?: string | null
  blood_type?: string | null
  allergies?: string | null
  insurance_provider?: string | null
  insurance_plan?: string | null
  insurance_member_number?: string | null
  notes?: string | null
  tags?: string[] | null
}

// ─── Hooks ───────────────────────────────────────────────────────

/**
 * Fetches paginated list of patients for a clinic.
 *
 * Usage:
 *   const { data, isLoading } = usePatients(clinicId, "garcia", 1)
 *
 * The query key ["patients", clinicId, search, page] means:
 * - React Query caches this result
 * - If you call usePatients with the SAME params, it returns cached data
 * - If you change search or page, it fetches new data
 */
export function usePatients(
  clinicId: string | null,
  search: string = "",
  page: number = 1,
  limit: number = 20
) {
  return useQuery<PatientsListResponse>({
    // The query key — uniquely identifies this cache entry
    // React Query re-fetches when any part of the key changes
    queryKey: ["patients", clinicId, search, page, limit],

    // The function that actually fetches data
    queryFn: async () => {
      const params = new URLSearchParams({
        clinic_id: clinicId!,
        search,
        page: String(page),
        limit: String(limit),
      })

      const res = await fetch(`/api/patients?${params}`)
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to fetch patients")
      }
      return res.json()
    },

    // Only run this query if we have a clinicId
    // (prevents fetching before the clinic is selected)
    enabled: !!clinicId,
  })
}

/**
 * Fetches a single patient's full details (for the edit page).
 *
 * Usage:
 *   const { data, isLoading } = usePatient(patientId, clinicId)
 */
export function usePatient(patientId: string | null, clinicId: string | null) {
  return useQuery<{ data: PatientDetail }>({
    queryKey: ["patient", patientId, clinicId],

    queryFn: async () => {
      const res = await fetch(
        `/api/patients/${patientId}?clinic_id=${clinicId}`
      )
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to fetch patient")
      }
      return res.json()
    },

    enabled: !!patientId && !!clinicId,
  })
}

/**
 * Mutation hook for creating a new patient.
 *
 * Usage:
 *   const createPatient = useCreatePatient()
 *   createPatient.mutate({ first_name: "Juan", ... })
 *
 * After success, it automatically invalidates the patients list cache,
 * so the list page shows the new patient without manual refresh.
 */
export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    // The function that sends data to the server
    mutationFn: async (input: CreatePatientInput) => {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to create patient")
      }
      return json
    },

    // After a successful creation, invalidate the patients list cache
    // This forces React Query to re-fetch the list, showing the new patient
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] })
    },
  })
}

/**
 * Mutation hook for updating a patient.
 *
 * Usage:
 *   const updatePatient = useUpdatePatient(patientId)
 *   updatePatient.mutate({ clinic_id: "xxx", patient: { first_name: "Juan" } })
 */
export function useUpdatePatient(patientId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdatePatientInput) => {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to update patient")
      }
      return json
    },

    // Invalidate both the list AND this specific patient's detail cache
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] })
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] })
    },
  })
}
