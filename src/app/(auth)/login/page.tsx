"use client"

/**
 * Login page: email + password form for staff.
 *
 * "use client" because this page needs:
 * - useState (to track email, password, error, loading)
 * - form submission handling (browser interactivity)
 * - Supabase auth call (runs in the browser)
 *
 * Only admin, secretary, and doctor can log in.
 * Patients do NOT have accounts.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  // useRouter lets us redirect to another page after login
  const router = useRouter()

  // State: what the user typed, plus loading/error tracking
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    // Prevent the browser from reloading the page on form submit
    e.preventDefault()
    setError("")
    setLoading(true)

    // Create a Supabase client (browser version, with anon key)
    const supabase = createClient()

    // Try to log in with the email and password
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      // Wrong email/password → show error message
      setError("Invalid email or password")
      setLoading(false)
      return
    }

    // Success → redirect to dashboard
    // router.push navigates without a full page reload
    router.push("/dashboard")
    router.refresh() // refresh to update the middleware auth check
  }

  return (
    <Card className="w-full max-w-sm rounded-md border border-[#e5e5e5] shadow-none">
      <CardHeader className="pb-4 text-center">
        {/* Blue title to match the sidebar branding */}
        <CardTitle className="text-2xl font-semibold text-blue-800">
          Turnera
        </CardTitle>
        <CardDescription className="text-gray-500">
          Sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* onSubmit runs handleLogin when the user clicks "Sign in" or presses Enter */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm text-[#1a1a1a]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@demo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm text-[#1a1a1a]">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
            />
          </div>

          {/* Show error message if login failed */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Flat blue button — matches primary accent color */}
          <Button
            type="submit"
            className="w-full bg-blue-500 text-white shadow-none hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
