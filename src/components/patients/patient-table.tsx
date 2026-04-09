/**
 * PatientTable — displays patients in a clean, flat table.
 *
 * Each row shows: Name, DNI, Phone, Insurance, Status indicator.
 * Clicking a row navigates to the patient edit page.
 *
 * The blacklist_status field shows a colored badge:
 * - "none" → nothing shown
 * - "warned" → yellow badge
 * - "blacklisted" → red badge
 *
 * This component receives data as props — it doesn't fetch anything.
 * The parent page handles fetching via the usePatients hook.
 */

"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { MessageCircle } from "lucide-react"
import type { PatientListItem } from "@/lib/hooks/use-patients"

type PatientTableProps = {
  patients: PatientListItem[]
  isLoading: boolean
  isFetching: boolean
}

export function PatientTable({ patients, isLoading, isFetching }: PatientTableProps) {
  const router = useRouter()

  // First-ever load: no cached data yet.
  if (isLoading) {
    return (
      <div className="rounded-md border border-[#e5e5e5] bg-white p-8 text-center text-sm text-gray-500">
        Loading patients...
      </div>
    )
  }

  // Subsequent search: show "Searching…" while the refetch is in flight to
  // avoid flashing "No patients found." before the response arrives.
  if (patients.length === 0) {
    return (
      <div className="rounded-md border border-[#e5e5e5] bg-white p-8 text-center text-sm text-gray-500">
        {isFetching ? "Searching..." : "No patients found."}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-[#e5e5e5] bg-white">
      {/* HTML table — the simplest way to display tabular data */}
      <table className="w-full text-sm">
        {/* Table header — column labels */}
        <thead>
          <tr className="border-b border-[#e5e5e5] bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-2.5">Name</th>
            <th className="px-4 py-2.5">DNI</th>
            <th className="px-4 py-2.5">Phone</th>
            <th className="px-4 py-2.5">Insurance</th>
            <th className="px-4 py-2.5">Status</th>
          </tr>
        </thead>

        {/* Table body — one row per patient */}
        <tbody>
          {patients.map((cp) => (
            <tr
              key={cp.id}
              // onClick navigates to the edit page using the clinic_patients ID
              onClick={() => router.push(`/patients/${cp.id}`)}
              className="cursor-pointer border-b border-[#e5e5e5] transition-colors last:border-b-0 hover:bg-gray-50"
            >
              {/* Name — last name first (medical convention) */}
              <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                {cp.last_name}, {cp.first_name}
              </td>

              {/* DNI */}
              <td className="px-4 py-2.5 text-gray-500">
                {cp.dni ?? "—"}
              </td>

              {/* Phone + WhatsApp indicator */}
              <td className="px-4 py-2.5 text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  {cp.phone ?? "—"}
                  {cp.phone && cp.whatsapp_enabled && (
                    <MessageCircle className="h-3.5 w-3.5 text-green-500" />
                  )}
                </span>
              </td>

              {/* Insurance */}
              <td className="px-4 py-2.5 text-gray-500">
                {cp.insurance_provider ?? "—"}
              </td>

              {/* Blacklist status badge */}
              <td className="px-4 py-2.5">
                <BlacklistBadge status={cp.blacklist_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Helper component ────────────────────────────────────────────

/**
 * Shows a colored badge based on blacklist status.
 * Uses the status colors from the design system.
 */
function BlacklistBadge({ status }: { status: string }) {
  if (status === "blacklisted") {
    return (
      <Badge className="bg-red-50 text-red-600 shadow-none hover:bg-red-50">
        Blacklisted
      </Badge>
    )
  }

  if (status === "warned") {
    return (
      <Badge className="bg-yellow-50 text-yellow-600 shadow-none hover:bg-yellow-50">
        Warned
      </Badge>
    )
  }

  // "none" → no badge needed
  return null
}
