/**
 * Patient List Page — /patients
 *
 * This page shows all patients linked to the current clinic.
 * It has:
 * - A search bar (debounced, filters by name or DNI)
 * - A "+ New Patient" button
 * - A table of patients (click a row to edit)
 * - Pagination controls
 *
 * "use client" because it uses:
 * - useState (search term, current page)
 * - useCallback (stable reference for the search handler)
 * - usePatients hook (React Query, needs client-side rendering)
 * - useClinic (reads the active clinic from context)
 */

"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useClinic } from "@/providers/clinic-provider"
import { usePatients } from "@/lib/hooks/use-patients"
import { PatientSearch } from "@/components/patients/patient-search"
import { PatientTable } from "@/components/patients/patient-table"
import { Button } from "@/components/ui/button"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"

export default function PatientsPage() {
  // Get the active clinic from context (set by ClinicSwitcher in topbar)
  const { activeClinicId } = useClinic()

  // Local state for search and pagination
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  // useCallback creates a stable function reference
  // Without it, PatientSearch would re-render on every parent render
  // because onSearch={() => ...} creates a new function each time
  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(1) // Reset to page 1 when search changes
  }, [])

  // Fetch patients using our React Query hook.
  // isLoading: true only on the very first fetch (no cache at all).
  // isFetching: true whenever a request is in flight (including refetches after
  // the user types in the search box). Passing both lets PatientTable show
  // "Searching…" during subsequent searches instead of flashing "No patients found."
  const { data, isLoading, isFetching } = usePatients(activeClinicId, search, page)

  const patients = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-4">
      {/* Header: title + new patient button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Patients</h1>
        <Link href="/patients/new">
          <Button className="bg-blue-500 shadow-none hover:bg-blue-600">
            <Plus className="mr-1.5 h-4 w-4" />
            New Patient
          </Button>
        </Link>
      </div>

      {/* Search bar */}
      <PatientSearch onSearch={handleSearch} />

      {/* Table */}
      <PatientTable patients={patients} isLoading={isLoading} isFetching={isFetching} />

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {(page - 1) * pagination.limit + 1}–
            {Math.min(page * pagination.limit, pagination.total)} of{" "}
            {pagination.total}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-[#e5e5e5] shadow-none"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-[#e5e5e5] shadow-none"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
