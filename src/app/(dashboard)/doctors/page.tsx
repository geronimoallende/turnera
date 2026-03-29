/**
 * Doctor List Page — /doctors
 *
 * Shows all doctors at the current clinic.
 * No "Add Doctor" button — doctors are created via CLI script (create-user.ts)
 * because they need Supabase Auth accounts.
 *
 * Doctors with role "doctor" only see themselves in the list.
 * Admin and secretary see all doctors.
 */

"use client"

import { useClinic } from "@/providers/clinic-provider"
import { useDoctors } from "@/lib/hooks/use-doctors"
import { DoctorTable } from "@/components/doctors/doctor-table"

export default function DoctorsPage() {
  const { activeClinicId } = useClinic()
  const { data, isLoading } = useDoctors(activeClinicId)

  const doctors = data?.data ?? []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[#1a1a1a]">Doctors</h1>
      <DoctorTable doctors={doctors} isLoading={isLoading} />
    </div>
  )
}
