import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types/database'

/**
 * Creates a Supabase client for use in the BROWSER (React components).
 * - Uses the anon key (public, safe to expose)
 * - Automatically includes the user's JWT from cookies
 * - RLS policies filter data based on who's logged in
 *
 * The cookies configuration is required so that signOut() can properly
 * clear auth cookies. Without it, signOut() hangs forever because
 * the library doesn't know how to read/write browser cookies.
 *
 * This is a singleton — the same client is reused across the entire app.
 * Creating multiple clients would cause auth state conflicts.
 */
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // Parse document.cookie into the format Supabase expects
            // document.cookie is a single string: "name1=value1; name2=value2"
            // Supabase wants an array: [{ name: "name1", value: "value1" }, ...]
            return document.cookie.split(';').map(c => {
              const [name, ...rest] = c.trim().split('=')
              return { name, value: decodeURIComponent(rest.join('=')) }
            }).filter(c => c.name)
          },
          setAll(cookiesToSet) {
            // Write each cookie to document.cookie
            // On signOut(), Supabase calls this to clear the auth cookies
            // by setting them with maxAge=0 (expired)
            cookiesToSet.forEach(({ name, value, options }) => {
              let cookie = `${name}=${encodeURIComponent(value)}`
              if (options?.path) cookie += `; path=${options.path}`
              if (options?.maxAge !== undefined) cookie += `; max-age=${options.maxAge}`
              if (options?.domain) cookie += `; domain=${options.domain}`
              if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
              document.cookie = cookie
            })
          },
        },
      }
    )
  }
  return client
}
