import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/types/database'

/**
 * Creates a Supabase client for use on the SERVER (API routes, server components).
 * - Reads the user's JWT from browser cookies
 * - Same permissions as the logged-in user (RLS applies)
 * - Must be called inside an async function (cookies() is async in Next.js)
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll can fail in Server Components (read-only).
            // This is expected — middleware handles the refresh instead.
          }
        },
      },
    }
  )
}
