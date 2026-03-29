/**
 * React Query hooks for doctor data.
 *
 * These hooks are the bridge between the API routes and the UI.
 * Same pattern as use-patients.ts:
 * - useQuery for fetching (cached, auto-refetch on key change)
 * - useMutation for creating/updating/deleting (invalidates cache on success)
 *
 * Hooks are organized by resource:
 * 1. Doctors (list, detail, update profile, update settings)
 * 2. Schedules (list, create, update, delete)
 * 3. Overrides (list, create, delete)
 * 4. Available Slots (fetch for a date)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ─── Types ───────────────────────────────────────────────────────

/** A doctor row as returned by the list endpoint */
export type DoctorListItem = {
  id: string
  staff_id: string
  full_name: string
  email: string
  specialty: string | null
  license_number: string | null
  is_active: boolean | null
  consultation_fee: number | null
  default_slot_duration_minutes: number
}

/** Full doctor detail as returned by the detail endpoint */
export type DoctorDetail = {
  id: string
  staff_id: string
  first_name: string
  last_name: string
  email: string
  specialty: string | null
  license_number: string | null
  clinic_settings: {
    id: string
    default_slot_duration_minutes: number
    max_daily_appointments: number | null
    consultation_fee: number | null
    allows_overbooking: boolean | null
    max_overbooking_slots: number | null
    is_active: boolean | null
  } | null
}

/** A schedule block row */
export type ScheduleBlock = {
  id: string
  doctor_id: string
  clinic_id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  is_active: boolean | null
  valid_from: string | null
  valid_until: string | null
}

/** An override row */
export type ScheduleOverride = {
  id: string
  doctor_id: string
  clinic_id: string
  override_date: string
  override_type: "block" | "available"
  start_time: string | null
  end_time: string | null
  reason: string | null
}

/** A time slot from get_available_slots */
export type TimeSlot = {
  slot_start: string
  slot_end: string
  is_available: boolean
  existing_appointment_id: string | null
}

// ─── Input types ─────────────────────────────────────────────────

type UpdateDoctorInput = {
  clinic_id: string
  first_name?: string
  last_name?: string
  specialty?: string | null
  license_number?: string | null
}

type UpdateSettingsInput = {
  clinic_id: string
  default_slot_duration_minutes?: number
  max_daily_appointments?: number | null
  consultation_fee?: number | null
  allows_overbooking?: boolean
  max_overbooking_slots?: number | null
  is_active?: boolean
}

type CreateScheduleInput = {
  clinic_id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes?: number
  valid_from?: string
  valid_until?: string | null
}

type UpdateScheduleInput = {
  clinic_id: string
  start_time?: string
  end_time?: string
  slot_duration_minutes?: number
  is_active?: boolean
  valid_from?: string
  valid_until?: string | null
}

type CreateOverrideInput = {
  clinic_id: string
  override_date: string
  override_type: "block" | "available"
  start_time?: string | null
  end_time?: string | null
  reason?: string | null
}

// ─── Doctor Hooks ────────────────────────────────────────────────

/** Fetch list of doctors at a clinic */
export function useDoctors(clinicId: string | null) {
  return useQuery<{ data: DoctorListItem[] }>({
    queryKey: ["doctors", clinicId],
    queryFn: async () => {
      const res = await fetch(`/api/doctors?clinic_id=${clinicId}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch doctors")
      }
      return res.json()
    },
    enabled: !!clinicId,
  })
}

/** Fetch a single doctor's full details + clinic settings */
export function useDoctor(doctorId: string | null, clinicId: string | null) {
  return useQuery<{ data: DoctorDetail }>({
    queryKey: ["doctor", doctorId, clinicId],
    queryFn: async () => {
      const res = await fetch(`/api/doctors/${doctorId}?clinic_id=${clinicId}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch doctor")
      }
      return res.json()
    },
    enabled: !!doctorId && !!clinicId,
  })
}

/** Mutation: update doctor profile (name, specialty, license) */
export function useUpdateDoctor(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateDoctorInput) => {
      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update doctor")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] })
      queryClient.invalidateQueries({ queryKey: ["doctor", doctorId] })
    },
  })
}

/** Mutation: update doctor clinic settings (fee, slots, overbooking) */
export function useUpdateDoctorSettings(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      const res = await fetch(`/api/doctors/${doctorId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update settings")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] })
      queryClient.invalidateQueries({ queryKey: ["doctor", doctorId] })
    },
  })
}

// ─── Schedule Hooks ──────────────────────────────────────────────

/** Fetch all schedule blocks for a doctor at a clinic */
export function useDoctorSchedules(doctorId: string | null, clinicId: string | null) {
  return useQuery<{ data: ScheduleBlock[] }>({
    queryKey: ["doctor-schedules", doctorId, clinicId],
    queryFn: async () => {
      const res = await fetch(
        `/api/doctors/${doctorId}/schedules?clinic_id=${clinicId}`
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch schedules")
      }
      return res.json()
    },
    enabled: !!doctorId && !!clinicId,
  })
}

/** Mutation: create a new schedule block */
export function useCreateSchedule(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateScheduleInput) => {
      const res = await fetch(`/api/doctors/${doctorId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create schedule")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-schedules", doctorId] })
    },
  })
}

/** Mutation: update a schedule block */
export function useUpdateSchedule(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ scheduleId, ...input }: UpdateScheduleInput & { scheduleId: string }) => {
      const res = await fetch(`/api/doctors/${doctorId}/schedules/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to update schedule")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-schedules", doctorId] })
    },
  })
}

/** Mutation: delete a schedule block */
export function useDeleteSchedule(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ scheduleId, clinicId }: { scheduleId: string; clinicId: string }) => {
      const res = await fetch(
        `/api/doctors/${doctorId}/schedules/${scheduleId}?clinic_id=${clinicId}`,
        { method: "DELETE" }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to delete schedule")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-schedules", doctorId] })
    },
  })
}

// ─── Override Hooks ──────────────────────────────────────────────

/** Fetch upcoming overrides for a doctor at a clinic */
export function useDoctorOverrides(doctorId: string | null, clinicId: string | null) {
  return useQuery<{ data: ScheduleOverride[] }>({
    queryKey: ["doctor-overrides", doctorId, clinicId],
    queryFn: async () => {
      const res = await fetch(
        `/api/doctors/${doctorId}/overrides?clinic_id=${clinicId}`
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch overrides")
      }
      return res.json()
    },
    enabled: !!doctorId && !!clinicId,
  })
}

/** Mutation: create a new override */
export function useCreateOverride(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateOverrideInput) => {
      const res = await fetch(`/api/doctors/${doctorId}/overrides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create override")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-overrides", doctorId] })
    },
  })
}

/** Mutation: delete an override */
export function useDeleteOverride(doctorId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ overrideId, clinicId }: { overrideId: string; clinicId: string }) => {
      const res = await fetch(
        `/api/doctors/${doctorId}/overrides/${overrideId}?clinic_id=${clinicId}`,
        { method: "DELETE" }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to delete override")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-overrides", doctorId] })
    },
  })
}

// ─── Available Slots Hook ────────────────────────────────────────

/** Fetch available slots for a doctor on a specific date */
export function useAvailableSlots(
  doctorId: string | null,
  clinicId: string | null,
  date: string | null
) {
  return useQuery<{ data: TimeSlot[] }>({
    queryKey: ["available-slots", doctorId, clinicId, date],
    queryFn: async () => {
      const res = await fetch(
        `/api/doctors/${doctorId}/available-slots?clinic_id=${clinicId}&date=${date}`
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch available slots")
      }
      return res.json()
    },
    enabled: !!doctorId && !!clinicId && !!date,
  })
}
