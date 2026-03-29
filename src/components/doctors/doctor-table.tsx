"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import type { DoctorListItem } from "@/lib/hooks/use-doctors"

type DoctorTableProps = {
  doctors: DoctorListItem[]
  isLoading: boolean
}

export function DoctorTable({ doctors, isLoading }: DoctorTableProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="rounded-md border border-[#e5e5e5] bg-white p-8 text-center text-sm text-gray-500">
        Loading doctors...
      </div>
    )
  }

  if (doctors.length === 0) {
    return (
      <div className="rounded-md border border-[#e5e5e5] bg-white p-8 text-center text-sm text-gray-500">
        No doctors found at this clinic.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-[#e5e5e5] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#e5e5e5] bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-4 py-2.5">Name</th>
            <th className="px-4 py-2.5">Specialty</th>
            <th className="px-4 py-2.5">License #</th>
            <th className="px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doc) => (
            <tr
              key={doc.id}
              onClick={() => router.push(`/doctors/${doc.id}`)}
              className="cursor-pointer border-b border-[#e5e5e5] transition-colors last:border-b-0 hover:bg-gray-50"
            >
              <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">
                {doc.full_name}
              </td>
              <td className="px-4 py-2.5 text-gray-500">
                {doc.specialty ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-gray-500">
                {doc.license_number ?? "—"}
              </td>
              <td className="px-4 py-2.5">
                {doc.is_active ? (
                  <Badge className="bg-green-50 text-green-600 shadow-none hover:bg-green-50">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500 shadow-none hover:bg-gray-100">
                    Inactive
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
