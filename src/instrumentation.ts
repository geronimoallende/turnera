import * as Sentry from "@sentry/nextjs"

/**
 * Next.js instrumentation hook — called ONCE when the app starts.
 *
 * WHY this file exists:
 * Next.js needs to know "hey, run this setup code before anything else."
 * The `register()` function is that setup code. Next.js detects this file
 * automatically by its name (`instrumentation.ts`) and calls `register()`.
 *
 * WHAT it does:
 * Checks which runtime is active (Node.js server or Edge) and loads
 * the correct Sentry config file. We can't load both because they use
 * different APIs — Node.js has features that Edge doesn't support.
 *
 * process.env.NEXT_RUNTIME is set by Next.js automatically:
 * - "nodejs" → your API routes and Server Components
 * - "edge"  → your middleware/proxy
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import: loads sentry.server.config.ts
    // The `await import()` syntax loads the file at runtime, not at build time.
    // This is important because edge runtime can't load Node.js-specific code.
    await import("../sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }
}

/**
 * Captures errors from Server Components, middleware, and proxies.
 *
 * Next.js calls this function automatically whenever an unhandled error
 * occurs in these contexts. Sentry.captureRequestError extracts the
 * error details (stack trace, request URL, headers) and sends them
 * to your Sentry dashboard.
 */
export const onRequestError = Sentry.captureRequestError
