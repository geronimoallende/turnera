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

  // useEffect sets up a SINGLE auth listener that handles everything.
  // Instead of calling getUser() manually + listening for changes (which causes
  // two simultaneous calls and a lock conflict), we use onAuthStateChange as
  // the ONLY source of truth.
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    // Fetches staff record + clinics for a given auth user
    async function loadStaffData(authUserId: string) {
      try {
        // Fetch the staff record for this auth user
        // .eq() means "where auth_user_id equals this value"
        // .single() means "I expect exactly one result"
        const { data: staff, error: staffError } = await supabase
          .from("staff")
          .select("id, auth_user_id, first_name, last_name, email")
          .eq("auth_user_id", authUserId)
          .single()

        if (cancelled) return

        if (staffError || !staff) {
          logger.error({ error: staffError?.message }, "Failed to load staff record")
          return
        }

        setStaffRecord(staff)

        // Fetch which clinics this staff member belongs to
        // The select joins staff_clinics with clinics to get clinic names
        // clinics(id, name, slug) means: "also fetch the related clinic data"
        const { data: clinics, error: clinicsError } = await supabase
          .from("staff_clinics")
          .select("clinic_id, role, clinics(id, name, slug)")
          .eq("staff_id", staff.id)

        if (cancelled) return

        if (clinicsError) {
          logger.error({ error: clinicsError.message }, "Failed to load staff clinics")
        } else if (clinics) {
          setStaffClinics(clinics as unknown as StaffClinic[])
        }
      } catch (err) {
        if (!cancelled) {
          logger.error({ error: err instanceof Error ? err.message : String(err) }, "Auth loading failed")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    // onAuthStateChange fires IMMEDIATELY with INITIAL_SESSION (the current
    // session if one exists), then again on any future login/logout.
    // This replaces the old pattern of getUser() + onAuthStateChange,
    // which caused two simultaneous calls fighting over the auth lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return

        if (event === "SIGNED_OUT" || !session?.user) {
          setUser(null)
          setStaffRecord(null)
          setStaffClinics([])
          setIsLoading(false)
        } else {
          // INITIAL_SESSION, SIGNED_IN, or TOKEN_REFRESHED
          setUser(session.user)
          await loadStaffData(session.user.id)
        }
      }
    )

    // Safety timeout: if auth loading takes more than 8 seconds,
    // force isLoading to false so the UI doesn't get stuck.
    // This can happen when Supabase's auth lock conflicts in dev mode
    // (React Strict Mode runs effects twice, causing lock contention).
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) {
        setIsLoading(false)
      }
    }, 8000)

    // Cleanup: when the component is removed (or Strict Mode re-runs),
    // cancel pending work and stop listening
    return () => {
      cancelled = true
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
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
