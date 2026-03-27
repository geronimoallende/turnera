import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

/**
 * Creates a Supabase client with FULL ACCESS (bypasses RLS).
 * - Uses the service_role key (secret, never exposed to browser)
 * - Only used in /api/chatbot/* routes (n8n has no login session)
 * - MUST always include clinic_id in queries manually (no RLS to protect you)
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
