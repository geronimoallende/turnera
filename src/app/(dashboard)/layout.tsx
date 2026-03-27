"use client"

/**
 * Dashboard layout — wraps ALL pages inside the (dashboard) route group.
 *
 * "use client" because it uses the AuthProvider hook (useAuth)
 * to check if the user data has finished loading.
 *
 * Structure:
 * ┌──────────────────────────────────────────┐
 * │ Sidebar │ Topbar                          │
 * │         │─────────────────────────────────│
 * │ Links   │                                 │
 * │         │   Main content area             │
 * │         │   (the actual page)             │
 * │         │                                 │
 * └──────────────────────────────────────────┘
 *
 * The sidebar is fixed on the left (w-64 = 256px).
 * The topbar is at the top of the remaining space.
 * The main content fills the rest.
 *
 * While auth data is loading, we show a simple "Loading..." message
 * so the user doesn't see a flash of empty content.
 */

import { useAuth } from "@/providers/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading } = useAuth()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Left sidebar — fixed width */}
      <Sidebar />

      {/* Right side — topbar + content */}
      <div className="flex flex-1 flex-col">
        <Topbar />

        {/* Main content area — scrollable, with padding */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
