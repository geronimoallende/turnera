import * as Sentry from "@sentry/nextjs"

Sentry.init({
  // DSN = "Data Source Name". It's a URL that tells Sentry WHERE to send errors.
  // It's safe to expose in the browser (it's read-only, can only SEND errors, not read them).
  // We read it from an environment variable so it's not hardcoded.
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // tracesSampleRate controls what percentage of requests get performance tracking.
  // 1.0 = 100% (every request). 0.2 = 20% (1 in 5 requests).
  // In development we want ALL data (1.0) to debug.
  // In production we sample 20% to save quota and money.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Session Replay: records what the user was doing when an error happened.
  // Like a video recording of their screen (but lighter — it captures DOM changes).
  // replaysSessionSampleRate: 10% of normal sessions get recorded.
  // replaysOnErrorSampleRate: 100% of sessions WITH ERRORS get recorded.
  // This way you always have a replay when something breaks.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Integrations are plugins that add extra functionality.
  // replayIntegration() enables the session replay feature described above.
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Only send errors to Sentry in production.
  // In development, errors show in the browser console — no need to send them.
  enabled: process.env.NODE_ENV === "production",
})
