import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

/**
 * Creates a Supabase client for use in the BROWSER (React components).
 * - Uses the anon key (public, safe to expose)
 * - Automatically includes the user's JWT from cookies
 * - RLS policies filter data based on who's logged in
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
