"use client"

/**
 * Global error boundary — the LAST safety net.
 *
 * This file catches errors that crash the entire app — when even the
 * root layout (the one with <html> and <body>) breaks. This is rare
 * but possible (e.g., a provider throws during initialization).
 *
 * WHY "use client"?
 * Error boundaries MUST be Client Components. React's error boundary
 * mechanism only works on the client (browser) side. Server Components
 * can't catch rendering errors — they need a client-side boundary.
 *
 * WHY does this render <html> and <body>?
 * When global-error.tsx activates, it REPLACES the root layout entirely.
 * The normal layout (with fonts, providers, sidebar) is gone — it crashed.
 * So this file must provide its own minimal HTML structure.
 *
 * WHAT are the props?
 * - error: the Error object that was thrown. Has .message and .digest
 *   (.digest is a hash that Next.js uses to identify the error)
 * - reset: a function that re-renders the app. Like pressing "refresh"
 *   but without a full page reload. If the error was transient (network
 *   hiccup, race condition), reset might fix it.
 *
 * Sentry.captureException sends the error to sentry.io automatically.
 * The useEffect ensures it only sends once (not on every re-render).
 */

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Send the error to Sentry when this component first renders.
  // useEffect with [error] dependency = "run this when error changes."
  // Since error only changes when a NEW error occurs, this effectively
  // runs once per error.
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          {/* Title */}
          <h1 className="text-2xl font-semibold text-gray-900">
            Something went wrong
          </h1>

          {/* Message — don't show the actual error to users (security).
              Just a friendly generic message. The real error is in Sentry. */}
          <p className="text-gray-600 max-w-md">
            An unexpected error occurred. Our team has been notified.
          </p>

          {/* Reset button — tries to re-render the app without a full reload.
              onClick={reset} means: "when clicked, call the reset function." */}
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
