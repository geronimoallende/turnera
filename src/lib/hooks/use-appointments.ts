/**
 * React Query hooks for appointments.
 *
 * These hooks are the bridge between the API routes and the UI components.
 * They handle:
 *   - Fetching data (useQuery) — with caching, loading states, error states
 *   - Modifying data (useMutation) — with automatic cache invalidation
 *
 * How it works:
 *   1. Component calls useAppointments(clinicId, { date: "2026-04-04" })
 *   2. React Query checks: "do I already have this data cached?"
 *      - Yes → return cached data instantly, refetch in background
 *      - No → show loading state, fetch from API, cache the result
 *   3. When a mutation succeeds (create, status change, etc.),
 *      we invalidate the cache → React Query refetches → UI updates
 *
 * Pattern reference: src/lib/hooks/use-patients.ts (same structure)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ─── Types ───────────────────────────────────────────────────────
// These types describe the shape of data coming from the API.
// They match what the API routes return in their JSON responses.

/** A single appointment as returned by GET /api/appointments */
export type AppointmentListItem = {
  id: string
  appointment_date: string          // "2026-04-04"
  start_time: string                // "09:30:00"
  end_time: string                  // "10:00:00"
  duration_minutes: number          // 30
  status: string                    // "confirmed", "arrived", etc.
  reason: string | null             // "Checkup"
  is_overbooking: boolean           // true if entreturno
  is_entreturno: boolean
  internal_notes: string | null
  checked_in_at: string | null      // when patient arrived (ISO timestamp)
  started_at: string | null         // when consultation started
  completed_at: string | null       // when consultation finished
  // Joined data from the doctors table (name comes from staff via staff_id)
  doctors: {
    id: string
    specialty: string | null
    staff: {
      first_name: string
      last_name: string
    }
  }
  // Joined data from the clinic_patients table
  clinic_patients: {
    id: string
    first_name: string
    last_name: string
    dni: string
    phone: string | null
    insurance_provider: string | null
    insurance_plan: string | null
    no_show_count: number
  }
}

/** Filters for the appointment list — sent as URL query params */
export type AppointmentFilters = {
  date?: string                     // single day: "2026-04-04"
  start_date?: string               // range start: "2026-04-01"
  end_date?: string                 // range end: "2026-04-30"
  doctor_id?: string                // filter by doctor
  status?: string                   // filter by status
  patient_id?: string               // filter by patient
}

/** What the queue endpoint returns for the doctor's waiting room */
export type QueueResponse = {
  in_progress: AppointmentListItem | null   // patient currently with doctor
  waiting: AppointmentListItem[]            // arrived, waiting their turn
  upcoming: AppointmentListItem[]           // confirmed, not arrived yet
  completed: number                         // count
  no_shows: number                          // count
}

/** Input for creating a new appointment */
type CreateAppointmentInput = {
  clinic_id: string
  doctor_id: string
  patient_id?: string               // existing patient
  appointment_date: string
  start_time: string
  duration_minutes: number
  reason?: string
  internal_notes?: string
  is_entreturno?: boolean
  source?: string
  new_patient?: {                   // OR create a new patient inline
    dni: string
    first_name: string
    last_name: string
    phone?: string
  }
}

/** Input for changing appointment status */
type UpdateStatusInput = {
  clinic_id: string
  status: string
  cancellation_reason?: string
}

/** Input for rescheduling */
type RescheduleInput = {
  clinic_id: string
  new_date: string
  new_start_time: string
  new_duration_minutes?: number
}

// ─── Query Hooks (read data) ─────────────────────────────────────

/**
 * Fetch appointments for a clinic with optional filters.
 * Used by the calendar page to load appointments for a day/week/month.
 *
 * Example:
 *   const { data, isLoading } = useAppointments(clinicId, { date: "2026-04-04" })
 *   const appointments = data?.data ?? []
 */
export function useAppointments(
  clinicId: string | null,
  filters: AppointmentFilters = {}
) {
  return useQuery<{ data: AppointmentListItem[] }>({
    // queryKey = unique identifier for this cached data.
    // React Query uses this to know when to refetch.
    // If clinicId or filters change → different key → refetch.
    queryKey: ["appointments", clinicId, filters],

    // queryFn = the function that actually fetches the data.
    // It builds a URL with query params and calls our API route.
    queryFn: async () => {
      // Build URL params: clinic_id=xxx&date=2026-04-04&doctor_id=yyy
      const params = new URLSearchParams({ clinic_id: clinicId! })

      // Add each filter if it has a value
      // Object.entries converts { date: "2026-04-04", doctor_id: "abc" }
      // into [["date", "2026-04-04"], ["doctor_id", "abc"]]
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })

      const res = await fetch(`/api/appointments?${params}`)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch appointments")
      }

      return res.json()
    },

    // enabled = only run this query if clinicId exists.
    // Without this, it would try to fetch with clinic_id=null and fail.
    enabled: !!clinicId,
  })
}

/**
 * Fetch a single appointment's full details.
 * Used by the side panel when you click an appointment block.
 */
export function useAppointment(
  appointmentId: string | null,
  clinicId: string | null
) {
  return useQuery({
    queryKey: ["appointment", appointmentId, clinicId],
    queryFn: async () => {
      const res = await fetch(
        `/api/appointments/${appointmentId}?clinic_id=${clinicId}`
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch appointment")
      }
      return res.json()
    },
    // Both must exist before fetching
    enabled: !!appointmentId && !!clinicId,
  })
}

/**
 * Fetch the doctor's patient queue (waiting room).
 * Used by the doctor's view to show who's waiting, who's next, etc.
 *
 * refetchInterval: 30000 means "also refetch every 30 seconds"
 * as a backup in case the Realtime subscription misses something.
 */
export function useDoctorQueue(
  clinicId: string | null,
  doctorId: string | null
) {
  return useQuery<QueueResponse>({
    queryKey: ["doctor-queue", clinicId, doctorId],
    queryFn: async () => {
      const params = new URLSearchParams({
        clinic_id: clinicId!,
        doctor_id: doctorId!,
      })
      const res = await fetch(`/api/appointments/queue?${params}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch queue")
      }
      return res.json()
    },
    enabled: !!clinicId && !!doctorId,
    // Refetch every 30 seconds as backup to Supabase Realtime
    refetchInterval: 30000,
  })
}

// ─── Mutation Hooks (modify data) ────────────────────────────────
// Mutations are for POST, PUT, PATCH, DELETE — anything that changes data.
// After a successful mutation, we "invalidate" related query caches,
// which tells React Query "this data is stale, refetch it."

/**
 * Create a new appointment.
 * Used by the booking form in the side panel.
 *
 * Example:
 *   const createAppointment = useCreateAppointment()
 *   createAppointment.mutate({ clinic_id, doctor_id, patient_id, ... })
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    // mutationFn = the function that sends data to the API
    mutationFn: async (input: CreateAppointmentInput) => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create appointment")
      return json
    },

    // onSuccess = what to do after the API returns success.
    // We invalidate two caches:
    //   "appointments" → calendar refetches to show the new block
    //   "available-slots" → slot preview refetches to show the slot as taken
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["available-slots"] })
    },
  })
}

/**
 * Change an appointment's status.
 * Used by the side panel buttons: "Arrived", "Start consultation", "Complete", "No show".
 *
 * Example:
 *   const updateStatus = useUpdateAppointmentStatus("appointment-uuid")
 *   updateStatus.mutate({ clinic_id, status: "arrived" })
 */
export function useUpdateAppointmentStatus(appointmentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateStatusInput) => {
      const res = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update status")
      return json
    },
    onSuccess: () => {
      // Invalidate everything that might show this appointment:
      queryClient.invalidateQueries({ queryKey: ["appointments"] })         // calendar list
      queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] })  // detail panel
      queryClient.invalidateQueries({ queryKey: ["doctor-queue"] })         // doctor's queue
    },
  })
}

/**
 * Reschedule an appointment (create new + mark old as rescheduled).
 * Used by the side panel "Reschedule" button and drag-and-drop.
 */
export function useRescheduleAppointment(appointmentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RescheduleInput) => {
      const res = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to reschedule")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] })
      queryClient.invalidateQueries({ queryKey: ["available-slots"] })
    },
  })
}
