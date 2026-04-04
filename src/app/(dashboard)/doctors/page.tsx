/**
 * Doctor List Page — /doctors
 *
 * Shows all doctors at the current clinic.
 * Admins see an "Add Doctor" button that links to /doctors/new.
 * Doctors with role "doctor" only see themselves in the list.
 * Admin and secretary see all doctors.
 */

"use client"

import Link from "next/link"
import { UserPlus } from "lucide-react"
import { useClinic } from "@/providers/clinic-provider"
import { useDoctors } from "@/lib/hooks/use-doctors"
import { DoctorTable } from "@/components/doctors/doctor-table"
import { Button } from "@/components/ui/button"

export default function DoctorsPage() {
  const { activeClinicId, activeRole } = useClinic()
  const { data, isLoading } = useDoctors(activeClinicId)

  const doctors = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Doctors</h1>
        {activeRole === "admin" && (
          <Link href="/doctors/new">
            <Button className="bg-blue-500 shadow-none hover:bg-blue-600">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Add Doctor
            </Button>
          </Link>
        )}
      </div>
      <DoctorTable doctors={doctors} isLoading={isLoading} />
    </div>
  )
}
