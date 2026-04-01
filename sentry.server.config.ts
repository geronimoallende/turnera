import * as Sentry from "@sentry/nextjs"

Sentry.init({
  // Same DSN as the client — errors go to the same Sentry project.
  // On the server, this is read from the process environment (not exposed to users).
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Same sampling strategy: 100% in dev, 20% in production.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // No replay integration here — replays only work in the browser (there's no "screen" on a server).
  // Server-side Sentry captures: stack traces, request data, breadcrumbs (a timeline of events
  // leading up to the error, like "queried database", "called Supabase", "error thrown").

  enabled: process.env.NODE_ENV === "production",
})
