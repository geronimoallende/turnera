"use client"

/**
 * Topbar — the horizontal bar at the top of the dashboard.
 *
 * Shows:
 * - Clinic switcher (left side) — pick which clinic to view
 * - User name + role badge + logout button (right side)
 *
 * The logout button calls supabase.auth.signOut(), which:
 * 1. Clears the JWT token from cookies
 * 2. AuthProvider detects "SIGNED_OUT" event and clears its state
 * 3. Middleware sees no token → redirects to /login
 */

import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"
import { useClinic } from "@/providers/clinic-provider"
import { ClinicSwitcher } from "@/components/shared/clinic-switcher"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut } from "lucide-react"

export function Topbar() {
  const { staffRecord } = useAuth()
  const { activeRole } = useClinic()

  function handleLogout() {
    // Safety: navigate to login after 2 seconds no matter what.
    // If signOut() hangs, we still get out.
    const timeout = setTimeout(() => {
      window.location.href = "/login"
    }, 2000)

    const supabase = createClient()
    supabase.auth.signOut().then(() => {
      clearTimeout(timeout)
      window.location.href = "/login"
    }).catch(() => {
      clearTimeout(timeout)
      window.location.href = "/login"
    })
  }

  return (
    <header className="flex h-12 items-center justify-between border-b bg-white px-4">
      {/* Left side: clinic switcher */}
      <ClinicSwitcher />

      {/* Right side: user info + logout */}
      <div className="flex items-center gap-3">
        {/* User name */}
        {staffRecord && (
          <span className="text-sm text-gray-700">
            {staffRecord.first_name} {staffRecord.last_name}
          </span>
        )}

        {/* Role badge — shows the user's role at the active clinic */}
        {activeRole && (
          <Badge variant="secondary" className="capitalize">
            {activeRole}
          </Badge>
        )}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-red-500 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  )
}
