"use client"

/**
 * AuthProvider — makes the logged-in user's info available everywhere.
 *
 * "use client" because it uses:
 * - useState (to store user data)
 * - useEffect (to fetch data when the app loads)
 * - createContext (React feature for sharing data without prop drilling)
 *
 * What it does:
 * 1. On mount (when the app loads), asks Supabase: "Who is logged in?"
 * 2. If someone is logged in, fetches their `staff` record from the database
 * 3. Also fetches their `staff_clinics` (which clinics + roles they have)
 * 4. Makes all of this available to any component via useAuth()
 *
 * What is "context"?
 * React Context is like a global variable for your component tree.
 * You create it with createContext(), provide a value at the top,
 * and any child component can read it with useContext().
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"

// ─── Types ───────────────────────────────────────────────────────────
// These describe the shape of the data we'll share

/** A staff record from the database */
type StaffRecord = {
  id: string
  auth_user_id: string
  first_name: string
  last_name: string
  email: string
}

/** A staff_clinics record — links a staff member to a clinic with a role */
type StaffClinic = {
  clinic_id: string
  role: "admin" | "doctor" | "secretary"
  clinics: {
    id: string
    name: string
    slug: string
  }
}

/** Everything the AuthProvider shares with the rest of the app */
type AuthContextType = {
  /** The Supabase Auth user (has email, id, etc.) — null if not logged in */
  user: User | null
  /** The staff database record (name, email) — null if not loaded yet */
  staffRecord: StaffRecord | null
  /** List of clinics this staff member belongs to, with their role at each */
  staffClinics: StaffClinic[]
  /** True while we're still checking if the user is logged in */
  isLoading: boolean
}

// ─── Context ─────────────────────────────────────────────────────────
// Create the context with default values (used before the provider loads)

const AuthContext = createContext<AuthContextType>({
  user: null,
  staffRecord: null,
  staffClinics: [],
  isLoading: true,
})

// ─── Provider Component ──────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State to hold all the auth data
  const [user, setUser] = useState<User | null>(null)
  const [staffRecord, setStaffRecord] = useState<StaffRecord | null>(null)
  const [staffClinics, setStaffClinics] = useState<StaffClinic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // useEffect runs code ONCE when the component first appears on screen.
  // We use it to check: "Is someone already logged in?"
  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      try {
        // Step 1: Ask Supabase Auth "who is logged in?"
        // getUser() checks the JWT token stored in cookies
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !authUser) {
          // No one is logged in, or auth check failed
          // (finally block will set isLoading = false)
          return
        }

        setUser(authUser)

        // Step 2: Fetch the staff record for this auth user
        // .eq() means "where auth_user_id equals this value"
        // .single() means "I expect exactly one result"
        const { data: staff, error: staffError } = await supabase
          .from("staff")
          .select("id, auth_user_id, first_name, last_name, email")
          .eq("auth_user_id", authUser.id)
          .single()

        if (staffError || !staff) {
          // Staff record not found — user exists in Auth but not in staff table
          // (finally block will set isLoading = false)
          logger.error({ error: staffError?.message }, "Failed to load staff record")
          return
        }

        setStaffRecord(staff)

        // Step 3: Fetch which clinics this staff member belongs to
        // The select joins staff_clinics with clinics to get clinic names
        // clinics(id, name, slug) means: "also fetch the related clinic data"
        const { data: clinics, error: clinicsError } = await supabase
          .from("staff_clinics")
          .select("clinic_id, role, clinics(id, name, slug)")
          .eq("staff_id", staff.id)

        if (clinicsError) {
          logger.error({ error: clinicsError.message }, "Failed to load staff clinics")
        } else if (clinics) {
          // TypeScript needs us to cast because Supabase returns a generic type
          setStaffClinics(clinics as unknown as StaffClinic[])
        }
      } catch (err) {
        // Catch any unexpected error (network failure, timeout, etc.)
        // so setIsLoading(false) ALWAYS runs and the UI never gets stuck
        logger.error({ error: err instanceof Error ? err.message : String(err) }, "Auth loading failed")
      } finally {
        // finally {} runs no matter what — whether the try succeeded or
        // threw an error. This guarantees isLoading becomes false.
        setIsLoading(false)
      }
    }

    loadUser()

    // Step 4: Listen for auth changes (login, logout, token refresh)
    // This way, if the user logs out in another tab, this tab updates too
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "SIGNED_OUT") {
          setUser(null)
          setStaffRecord(null)
          setStaffClinics([])
        } else if (event === "SIGNED_IN") {
          // Reload everything when someone signs in
          loadUser()
        }
      }
    )

    // Cleanup: when the component is removed, stop listening
    return () => {
      subscription.unsubscribe()
    }
  }, []) // Empty array = run only once on mount

  // useMemo prevents creating a new object on every render.
  // Without it, every time AuthProvider re-renders (e.g., parent state changes),
  // ALL components using useAuth() would re-render too — even if none of the
  // auth values actually changed. useMemo only creates a new object when one
  // of the listed dependencies [user, staffRecord, staffClinics, isLoading] changes.
  const value = useMemo(
    () => ({ user, staffRecord, staffClinics, isLoading }),
    [user, staffRecord, staffClinics, isLoading]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────
// Custom hook so components can easily access the auth data.
// Usage: const { user, staffRecord, staffClinics } = useAuth()

export function useAuth() {
  return useContext(AuthContext)
}
