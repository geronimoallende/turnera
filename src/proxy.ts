import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

/**
 * Next.js proxy — runs on every request BEFORE the page loads.
 * Calls our auth helper to check login status and redirect if needed.
 *
 * This was called "middleware" before Next.js 16. Same API, just renamed.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

/**
 * matcher: which URLs this proxy runs on.
 * It runs on EVERYTHING except:
 * - /_next/* (Next.js internal files: JS, CSS, images)
 * - /favicon.ico, /public files
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/chatbot|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
