import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

/**
 * Next.js middleware — runs on every request BEFORE the page loads.
 * Calls our auth helper to check login status and redirect if needed.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

/**
 * matcher: which URLs this middleware runs on.
 * It runs on EVERYTHING except:
 * - /api/chatbot/* (n8n doesn't have a login, uses webhook secret instead)
 * - /_next/* (Next.js internal files: JS, CSS, images)
 * - /favicon.ico, /public files
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/chatbot|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
