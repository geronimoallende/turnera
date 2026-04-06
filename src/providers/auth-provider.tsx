"use client"

/**
 * AuthProvider — makes the logged-in user's info available everywhere.
 *
 * What it does:
 * 1. On mount, reads the cached session from localStorage (getSession)
 * 2. If logged in, fetches their staff record + clinic assignments
 * 3. Listens for auth changes (login, logout)
 * 4. Makes all of this available via useAuth()
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"

type StaffRecord = {
  id: string
  auth_user_id: string
  first_name: string
  last_name: string
  email: string
}

type StaffClinic = {
  clinic_id: string
  role: "admin" | "doctor" | "secretary"
  clinics: {
    id: string
    name: string
    slug: string
  }
}

type AuthContextType = {
  user: User | null
  staffRecord: StaffRecord | null
  staffClinics: StaffClinic[]
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  staffRecord: null,
  staffClinics: [],
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [staffRecord, setStaffRecord] = useState<StaffRecord | null>(null)
  const [staffClinics, setStaffClinics] = useState<StaffClinic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function loadUser() {
      try {
        // getSession() reads from localStorage — no network call, no navigator lock.
        // Safe under React Strict Mode (double-mount). The middleware already
        // validates the JWT server-side on every request.
        const { data: { session } } = await supabase.auth.getSession()

        if (cancelled) return

        if (!session?.user) {
          return
        }

        setUser(session.user)

        const { data: staff, error: staffError } = await supabase
          .from("staff")
          .select("id, auth_user_id, first_name, last_name, email")
          .eq("auth_user_id", session.user.id)
          .single()

        if (cancelled) return

        if (staffError || !staff) {
          logger.error({ error: staffError?.message }, "Failed to load staff record")
          return
        }

        setStaffRecord(staff)

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

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled) return
        // Skip INITIAL_SESSION — we already loaded it above with getSession()
        if (event === "INITIAL_SESSION") return
        if (event === "SIGNED_OUT") {
          setUser(null)
          setStaffRecord(null)
          setStaffClinics([])
          setIsLoading(false)
        } else if (session?.user) {
          // SIGNED_IN or TOKEN_REFRESHED — reload everything
          loadUser()
        }
      }
    )

    // Safety timeout: if auth loading takes more than 8 seconds,
    // force isLoading to false so the UI never gets stuck
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) setIsLoading(false)
    }, 8000)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [])

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

export function useAuth() {
  return useContext(AuthContext)
}
