import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // The edge runtime is very constrained (no Node.js APIs).
  // Sentry's edge SDK is a stripped-down version that works within these limits.
  // It captures errors in middleware/proxy, which is important because
  // auth failures (expired JWT, invalid session) happen here.

  enabled: process.env.NODE_ENV === "production",
})
