import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

/**
 * Creates a Supabase client for use in the BROWSER (React components).
 * - Uses the anon key (public, safe to expose)
 * - Automatically includes the user's JWT from cookies
 * - RLS policies filter data based on who's logged in
 *
 * DO NOT add a custom cookies handler here.
 * createBrowserClient handles cookies internally (localStorage + memory).
 * A custom handler using document.cookie breaks auth because:
 *   1. httpOnly cookies are invisible to document.cookie
 *   2. The garbled token causes RLS queries to fail ("Failed to load staff record")
 *
 * Logout is handled by the server-side endpoint POST /api/auth/signout,
 * which CAN access httpOnly cookies.
 *
 * This is a singleton — the same client is reused across the entire app.
 */
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
