"use client"

/**
 * ClinicProvider — tracks which clinic the user is currently viewing.
 *
 * "use client" because it uses useState and createContext.
 *
 * Why this exists:
 * Staff can belong to multiple clinics. When they log in, they need to
 * pick which clinic to work with. This provider holds that choice.
 *
 * When activeClinicId changes (e.g., user picks a different clinic from
 * the dropdown), all components that use useClinic() will re-render
 * with the new clinic's data.
 *
 * It also provides `activeRole` — the user's role at the currently
 * selected clinic. This is important because the same person could be
 * an admin at Clinic A but a secretary at Clinic B.
 */

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-provider"

// ─── Types ───────────────────────────────────────────────────────────

type ClinicContextType = {
  /** The UUID of the currently selected clinic */
  activeClinicId: string | null
  /** The user's role at the active clinic (admin/doctor/secretary) */
  activeRole: "admin" | "doctor" | "secretary" | null
  /** The name of the active clinic (for display in the topbar) */
  activeClinicName: string | null
  /** Function to switch to a different clinic */
  setActiveClinicId: (clinicId: string) => void
}

// ─── Context ─────────────────────────────────────────────────────────

const ClinicContext = createContext<ClinicContextType>({
  activeClinicId: null,
  activeRole: null,
  activeClinicName: null,
  setActiveClinicId: () => {},
})

// ─── Provider Component ──────────────────────────────────────────────

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  // Get the user's clinics from AuthProvider
  // (ClinicProvider is nested INSIDE AuthProvider, so useAuth() works)
  const { staffClinics } = useAuth()

  // Which clinic is currently selected
  const [activeClinicId, setActiveClinicId] = useState<string | null>(null)

  // When staffClinics loads (or changes), auto-select the first clinic.
  // Also recovers if the current activeClinicId is no longer in the list
  // (e.g., after a token refresh momentarily cleared and reloaded the data).
  useEffect(() => {
    if (staffClinics.length > 0) {
      // Check: is the current activeClinicId still valid?
      const stillValid = activeClinicId && staffClinics.some(
        (sc) => sc.clinic_id === activeClinicId
      )
      // If no clinic selected yet, or current selection is no longer valid → pick first
      if (!stillValid) {
        setActiveClinicId(staffClinics[0].clinic_id)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffClinics])

  // Find the current clinic's data from the list
  const activeClinic = staffClinics.find(
    (sc) => sc.clinic_id === activeClinicId
  )

  return (
    <ClinicContext.Provider
      value={{
        activeClinicId,
        activeRole: activeClinic?.role ?? null,
        activeClinicName: activeClinic?.clinics?.name ?? null,
        setActiveClinicId,
      }}
    >
      {children}
    </ClinicContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────
// Usage: const { activeClinicId, activeRole, setActiveClinicId } = useClinic()

export function useClinic() {
  return useContext(ClinicContext)
}
