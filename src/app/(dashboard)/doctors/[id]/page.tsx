/**
 * Doctor Detail Page — /doctors/[id]
 *
 * Shows all 5 sections of a doctor's configuration:
 * 1. Profile (name, email, specialty, license)
 * 2. Clinic Settings (fee, slot duration, overbooking)
 * 3. Weekly Schedule (time blocks by day)
 * 4. Schedule Overrides (vacations, sick days, extra hours)
 * 5. Slots Preview (check availability by date)
 *
 * Permissions:
 * - Admin: can edit everything
 * - Doctor (own page): can edit profile, schedule, overrides. Read-only clinic settings.
 * - Secretary: read-only everything
 */

"use client"

import { use } from "react"
import Link from "next/link"
import { useClinic } from "@/providers/clinic-provider"
import { useAuth } from "@/providers/auth-provider"
import {
  useDoctor,
  useUpdateDoctor,
  useUpdateDoctorSettings,
  useDoctorSchedules,
  useCreateSchedule,
  useDeleteSchedule,
  useDoctorOverrides,
  useCreateOverride,
  useDeleteOverride,
} from "@/lib/hooks/use-doctors"
import { DoctorProfileForm, type DoctorProfileFormData } from "@/components/doctors/doctor-profile-form"
import { ClinicSettingsForm, type ClinicSettingsFormData } from "@/components/doctors/clinic-settings-form"
import { ScheduleEditor } from "@/components/doctors/schedule-editor"
import { OverrideManager } from "@/components/doctors/override-manager"
import { SlotsPreview } from "@/components/doctors/slots-preview"
import { ArrowLeft, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: doctorId } = use(params)
  const { activeClinicId, activeRole } = useClinic()
  const { staffRecord } = useAuth()

  // ─── Data fetching ─────────────────────────────────────────
  const { data: doctorData, isLoading, error } = useDoctor(doctorId, activeClinicId)
  const { data: schedulesData } = useDoctorSchedules(doctorId, activeClinicId)
  const { data: overridesData } = useDoctorOverrides(doctorId, activeClinicId)

  // ─── Mutations ─────────────────────────────────────────────
  const updateDoctor = useUpdateDoctor(doctorId)
  const updateSettings = useUpdateDoctorSettings(doctorId)
  const createSchedule = useCreateSchedule(doctorId)
  const deleteSchedule = useDeleteSchedule(doctorId)
  const createOverride = useCreateOverride(doctorId)
  const deleteOverride = useDeleteOverride(doctorId)

  // ─── Permission logic ─────────────────────────────────────
  const doctor = doctorData?.data
  const isAdmin = activeRole === "admin"
  const isOwnDoctor = staffRecord?.id === doctor?.staff_id
  const canEditProfile = isAdmin || isOwnDoctor
  const canEditSettings = isAdmin
  const canEditSchedule = isAdmin || isOwnDoctor

  // ─── Handlers ──────────────────────────────────────────────
  function handleProfileSubmit(data: DoctorProfileFormData) {
    if (!activeClinicId) return
    updateDoctor.mutate({ clinic_id: activeClinicId, ...data })
  }

  function handleSettingsSubmit(data: ClinicSettingsFormData) {
    if (!activeClinicId) return
    updateSettings.mutate({ clinic_id: activeClinicId, ...data })
  }

  function handleAddSchedule(data: {
    day_of_week: number
    start_time: string
    end_time: string
    slot_duration_minutes?: number
    valid_from?: string
    valid_until?: string
  }) {
    if (!activeClinicId) return
    createSchedule.mutate({ clinic_id: activeClinicId, ...data })
  }

  function handleDeleteSchedule(scheduleId: string) {
    if (!activeClinicId) return
    deleteSchedule.mutate({ scheduleId, clinicId: activeClinicId })
  }

  function handleAddOverride(data: {
    override_date: string
    override_type: "block" | "available"
    start_time?: string
    end_time?: string
    reason?: string
  }) {
    if (!activeClinicId) return
    createOverride.mutate({
      clinic_id: activeClinicId,
      override_date: data.override_date,
      override_type: data.override_type,
      start_time: data.start_time ?? null,
      end_time: data.end_time ?? null,
      reason: data.reason ?? null,
    })
  }

  function handleDeleteOverride(overrideId: string) {
    if (!activeClinicId) return
    deleteOverride.mutate({ overrideId, clinicId: activeClinicId })
  }

  // ─── Loading / Error states ────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-gray-500">
        Loading doctor...
      </div>
    )
  }

  if (error || !doctor) {
    return (
      <div className="space-y-4">
        <Link
          href="/doctors"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a1a1a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to doctors
        </Link>
        <div className="rounded-md border border-[#e5e5e5] bg-white p-8 text-center text-sm text-red-600">
          {error?.message || "Doctor not found"}
        </div>
      </div>
    )
  }

  const schedules = schedulesData?.data ?? []
  const overrides = overridesData?.data ?? []
  const defaultSlotDuration = doctor.clinic_settings?.default_slot_duration_minutes ?? 30

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/doctors"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a1a1a]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to doctors
      </Link>

      {/* Doctor name heading + preview link */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">
          {doctor.last_name}, {doctor.first_name}
        </h1>
        <Link href={`/doctors/${doctorId}/schedule-preview`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <CalendarDays className="h-4 w-4" />
            Preview schedule
          </Button>
        </Link>
      </div>

      {/* Section 1: Profile */}
      <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
        <DoctorProfileForm
          defaultValues={{
            first_name: doctor.first_name,
            last_name: doctor.last_name,
            phone: doctor.phone ?? null,
            whatsapp_enabled: doctor.whatsapp_enabled ?? false,
            specialty: doctor.specialty,
            license_number: doctor.license_number,
          }}
          email={doctor.email}
          canEdit={canEditProfile}
          onSubmit={handleProfileSubmit}
          isSubmitting={updateDoctor.isPending}
          error={updateDoctor.error?.message}
        />
      </div>

      {/* Section 2: Clinic Settings */}
      {doctor.clinic_settings && (
        <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
          <ClinicSettingsForm
            defaultValues={{
              default_slot_duration_minutes: doctor.clinic_settings.default_slot_duration_minutes,
              max_daily_appointments: doctor.clinic_settings.max_daily_appointments,
              consultation_fee: doctor.clinic_settings.consultation_fee,
              allows_overbooking: doctor.clinic_settings.allows_overbooking ?? false,
              max_overbooking_slots: doctor.clinic_settings.max_overbooking_slots,
              can_create_appointments: doctor.clinic_settings.can_create_appointments ?? false,
              can_cancel_appointments: doctor.clinic_settings.can_cancel_appointments ?? false,
            }}
            canEdit={canEditSettings}
            onSubmit={handleSettingsSubmit}
            isSubmitting={updateSettings.isPending}
            error={updateSettings.error?.message}
          />
        </div>
      )}

      {/* Section 3: Weekly Schedule */}
      <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
        <ScheduleEditor
          schedules={schedules}
          canEdit={canEditSchedule}
          isCreating={createSchedule.isPending}
          isCreateSuccess={createSchedule.isSuccess}
          createError={createSchedule.error?.message}
          onAdd={handleAddSchedule}
          onDelete={handleDeleteSchedule}
          defaultSlotDuration={defaultSlotDuration}
        />
      </div>

      {/* Section 4: Schedule Overrides */}
      <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
        <OverrideManager
          overrides={overrides}
          canEdit={canEditSchedule}
          isCreating={createOverride.isPending}
          createError={createOverride.error?.message}
          onAdd={handleAddOverride}
          onDelete={handleDeleteOverride}
        />
      </div>

      {/* Section 5: Slots Preview */}
      {activeClinicId && (
        <div className="rounded-md border border-[#e5e5e5] bg-white p-6">
          <SlotsPreview doctorId={doctorId} clinicId={activeClinicId} />
        </div>
      )}
    </div>
  )
}
