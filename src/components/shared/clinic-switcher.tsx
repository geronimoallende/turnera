"use client"

/**
 * ClinicSwitcher — dropdown to switch between clinics.
 *
 * If a staff member works at only 1 clinic, this just shows the clinic name
 * (no dropdown needed). If they work at 2+, it shows a dropdown.
 *
 * When the user picks a different clinic, it calls setActiveClinicId()
 * from ClinicProvider, which causes all components to re-render with
 * the new clinic's data.
 */

import { useAuth } from "@/providers/auth-provider"
import { useClinic } from "@/providers/clinic-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ClinicSwitcher() {
  const { staffClinics } = useAuth()
  const { activeClinicId, setActiveClinicId } = useClinic()

  // Only 1 clinic? Just show the name, no dropdown needed
  if (staffClinics.length <= 1) {
    return (
      <span className="text-sm font-medium">
        {staffClinics[0]?.clinics?.name ?? "No clinic"}
      </span>
    )
  }

  // Multiple clinics? Show a dropdown (Select component from shadcn/ui)
  return (
    <Select value={activeClinicId ?? ""} onValueChange={(value) => { if (value) setActiveClinicId(value) }}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select clinic" />
      </SelectTrigger>
      <SelectContent>
        {staffClinics.map((sc) => (
          <SelectItem key={sc.clinic_id} value={sc.clinic_id}>
            {sc.clinics.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
