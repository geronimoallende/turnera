"use client"

/**
 * Dashboard page — the main "home" page after login.
 *
 * For now, this is a placeholder. Later (Task 15), we'll add:
 * - QuickStats (today's appointment counts)
 * - TodayAgenda (chronological list of today's appointments)
 * - AlertsPanel (unconfirmed appointments, overdue patients)
 */

import { useAuth } from "@/providers/auth-provider"
import { useClinic } from "@/providers/clinic-provider"

export default function DashboardPage() {
  const { staffRecord } = useAuth()
  const { activeClinicName, activeRole } = useClinic()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome, {staffRecord?.first_name ?? "User"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {activeClinicName} — {activeRole}
        </p>
      </div>

      <div className="rounded-md border bg-white p-8 text-center text-gray-500">
        Dashboard content coming soon. We&apos;ll add stats, today&apos;s agenda, and
        alerts here in Task 15.
      </div>
    </div>
  )
}
