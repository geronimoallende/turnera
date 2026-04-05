/**
 * API Route: /api/auth/signout
 *
 * POST /api/auth/signout
 *   → Signs out the user SERVER-SIDE
 *   → Clears the httpOnly auth cookies that JavaScript can't touch
 *   → Returns 200 so the client knows it's safe to redirect to /login
 *
 * Why do we need this?
 * Supabase auth cookies are httpOnly — the browser's JavaScript (document.cookie)
 * CANNOT read or delete them. Only the server can. So client-side signOut()
 * clears the in-memory session but the cookies persist. The middleware still
 * sees a valid JWT on the next request and redirects back to dashboard.
 *
 * This endpoint creates a server-side Supabase client (which CAN access
 * the cookies), calls signOut() (which clears them), and returns the
 * response with the cleared cookie headers.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
