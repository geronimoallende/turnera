"use client"

/**
 * Dashboard error boundary — catches errors in any dashboard page.
 *
 * HOW IT WORKS:
 * When any page inside (dashboard)/ throws an error during rendering,
 * Next.js catches it and renders THIS component instead of the broken page.
 *
 * WHAT STAYS VISIBLE:
 * The sidebar and topbar remain on screen. They're defined in
 * (dashboard)/layout.tsx which is ABOVE this error boundary.
 * Think of it as layers:
 *
 *   layout.tsx (sidebar + topbar)     ← stays visible
 *     └── error.tsx (this file)       ← replaces the broken page content
 *           └── page.tsx (broken)     ← this crashed, so it's hidden
 *
 * The user sees the sidebar, topbar, and an error message in the main
 * content area. They can navigate to another page or click "Try again."
 *
 * WHAT are the props?
 * Same as global-error.tsx:
 * - error: the Error that crashed the page
 * - reset: function to retry rendering the page
 */

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Send error to Sentry once
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">
          Something went wrong
        </h2>
        <p className="text-gray-600 max-w-md">
          There was an error loading this page. Our team has been notified.
        </p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
