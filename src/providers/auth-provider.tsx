"use client"

/**
 * AuthProvider — makes the logged-in user's info available everywhere.
 *
 * "use client" because it uses:
 * - useState (to store user data)
 * - useEffect (to fetch data when the app loads)
 * - useRef (to track async operations across React Strict Mode re-mounts)
 * - createContext (React feature for sharing data without prop drilling)
 *
 * What it does:
 * 1. On mount, reads the current session from memory (getSession)
 * 2. If someone is logged in, fetches their `staff` record from the database
 * 3. Also fetches their `staff_clinics` (which clinics + roles they have)
 * 4. Listens for future auth changes (login, logout, token refresh)
 * 5. Makes all of this available to any component via useAuth()
 *
 * Why useRef + Symbol?
 * React Strict Mode (enabled in dev) runs useEffect TWICE:
 *   Mount 1 → Cleanup → Mount 2
 * If Mount 1 started an async operation (like fetching staff data),
 * it might finish AFTER Mount 2 already started. Without protection,
 * Mount 1's stale results would overwrite Mount 2's fresh results.
 *
 * The Symbol pattern solves this:
 * - Each mount creates a unique Symbol (like a unique ID)
 * - Before any setState call, we check: "is MY symbol still the active one?"
 * - If not, this mount was cleaned up — discard the results
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"

// ─── Types ───────────────────────────────────────────────────────────

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

const AuthContext = createContext<AuthContextType>({
  user: null,
  staffRecord: null,
  staffClinics: [],
  isLoading: true,
})

// ─── Provider Component ──────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [staffRecord, setStaffRecord] = useState<StaffRecord | null>(null)
  const [staffClinics, setStaffClinics] = useState<StaffClinic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Ref that holds the "operation ID" of the current mount.
  // When cleanup runs (Strict Mode unmount), we set this to null,
  // which tells any pending async work: "you're stale, stop."
  const currentOpRef = useRef<symbol | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Create a unique ID for THIS mount's async work.
    // Symbol() always creates a unique value — like a fingerprint.
    const opId = Symbol()
    currentOpRef.current = opId

    // Helper: checks if this mount is still the active one.
    // If React cleaned us up (Strict Mode), currentOpRef.current
    // will be null or a different Symbol, so this returns false.
    function isActive() {
      return currentOpRef.current === opId
    }

    // Fetches staff record + clinics for a given auth user ID.
    // Called after we know WHO is logged in.
    async function loadStaffData(authUserId: string) {
      try {
        // Fetch the staff record for this auth user.
        // .eq("auth_user_id", ...) = WHERE auth_user_id = this value
        // .single() = expect exactly one result (throws if 0 or 2+)
        const { data: staff, error: staffError } = await supabase
          .from("staff")
          .select("id, auth_user_id, first_name, last_name, email")
          .eq("auth_user_id", authUserId)
          .single()

        // Check if we're still the active mount before updating state
        if (!isActive()) return

        if (staffError || !staff) {
          logger.error({ error: staffError?.message }, "Failed to load staff record")
          return
        }

        setStaffRecord(staff)

        // Fetch which clinics this staff member belongs to.
        // clinics(id, name, slug) = JOIN with clinics table, get those columns
        const { data: clinics, error: clinicsError } = await supabase
          .from("staff_clinics")
          .select("clinic_id, role, clinics(id, name, slug)")
          .eq("staff_id", staff.id)

        if (!isActive()) return

        if (clinicsError) {
          logger.error({ error: clinicsError.message }, "Failed to load staff clinics")
        } else if (clinics) {
          setStaffClinics(clinics as unknown as StaffClinic[])
        }
      } catch (err) {
        if (isActive()) {
          logger.error(
            { error: err instanceof Error ? err.message : String(err) },
            "Auth loading failed"
          )
        }
      } finally {
        if (isActive()) {
          setIsLoading(false)
        }
      }
    }

    // ── Step 1: Read the current session from memory ──────────────
    // getSession() reads the session from the in-memory store / cookies.
    // It does NOT make a network call and does NOT acquire a navigator lock.
    // This is why it's safe under Strict Mode — two getSession() calls
    // don't fight over anything.
    //
    // Note: Supabase docs say "don't use getSession() for authorization."
    // That's for SERVER-SIDE code. Here on the client, we only use it
    // for UI display (user name, clinic list). All actual authorization
    // happens server-side: middleware and API routes use getUser() (verified JWT),
    // and RLS policies run on the database server.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isActive()) return

      if (session?.user) {
        setUser(session.user)
        loadStaffData(session.user.id)
      } else {
        setUser(null)
        setIsLoading(false)
      }
    })

    // ── Step 2: Listen for FUTURE auth changes ────────────────────
    // onAuthStateChange fires events when the user logs in, logs out,
    // or their token is refreshed. We skip INITIAL_SESSION because
    // we already handled it above with getSession().
    //
    // Why skip INITIAL_SESSION?
    // onAuthStateChange internally calls _emitInitialSession(), which
    // acquires a navigator lock. Under Strict Mode, two listeners on
    // the same client would fight over this lock — that was the original bug.
    // By skipping it, we avoid the lock entirely.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isActive()) return

        // Skip INITIAL_SESSION — we already have the session from getSession()
        if (event === "INITIAL_SESSION") return

        if (event === "SIGNED_OUT") {
          // Only clear state on explicit sign out — NOT on incomplete sessions.
          // The old code had `|| !session?.user` which triggered during
          // TOKEN_REFRESHED events with momentarily incomplete session objects,
          // causing "No clinic" to flash randomly.
          setUser(null)
          setStaffRecord(null)
          setStaffClinics([])
          setIsLoading(false)
        } else if (session?.user) {
          // SIGNED_IN or TOKEN_REFRESHED — update user data.
          // We check session?.user instead of checking the event name,
          // because what matters is: do we have a valid user? If yes, use it.
          setUser(session.user)
          await loadStaffData(session.user.id)
        }
      }
    )

    // Safety timeout: if auth loading takes more than 5 seconds,
    // force isLoading to false so the UI never gets stuck.
    const safetyTimeout = setTimeout(() => {
      if (isActive()) {
        setIsLoading(false)
      }
    }, 5000)

    // ── Cleanup ───────────────────────────────────────────────────
    // Runs when the component unmounts (or Strict Mode re-runs the effect).
    // 1. Invalidate the operation ID → pending async work will bail out
    // 2. Unsubscribe the auth listener → stop receiving events
    return () => {
      currentOpRef.current = null
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [])

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
