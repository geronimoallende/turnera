import pino from "pino"

/**
 * Structured JSON logger for the entire application.
 *
 * WHY: console.error gives you a string with no context. Pino gives you
 * JSON with timestamps, log levels, and arbitrary context fields.
 * Tools like Grafana Loki can parse and query these structured logs.
 *
 * USAGE:
 *   import { logger } from "@/lib/logger"
 *
 *   // Simple log
 *   logger.info("Server started")
 *
 *   // Log with context (these become JSON fields)
 *   logger.error({ clinicId, userId, error: err.message }, "Failed to create patient")
 *
 *   // Create a child logger for a specific request
 *   const reqLogger = logger.child({ requestId: "abc-123", clinicId: "xyz" })
 *   reqLogger.info("Processing request")  // includes requestId + clinicId automatically
 */
const logger = pino({
  // level: controls the MINIMUM severity of logs that get output.
  // Pino has these levels (from least to most severe):
  //   trace (10) → debug (20) → info (30) → warn (40) → error (50) → fatal (60)
  //
  // Setting level to "info" means: show info, warn, error, fatal. Hide trace and debug.
  // We read from LOG_LEVEL env var so you can change it without modifying code.
  // In production you'd normally use "info". To debug an issue, set it to "debug".
  level: process.env.LOG_LEVEL ?? "info",

  // base: fields that appear in EVERY log line automatically.
  // "service": "turnera-web" identifies this app's logs when you have
  // multiple services (later we'll also have "turnera-ai" for the Python backend).
  // In Grafana you can filter: {service="turnera-web"} to see only Next.js logs.
  base: {
    service: "turnera-web",
  },

  // In development: output goes to stdout (the terminal where npm run dev is running).
  // In production: Pino outputs pure JSON which log aggregators (Grafana Loki) can parse.
  // We don't use pino-pretty here because it adds a dependency and slows things down.
  // Instead, the raw JSON in development is still readable enough for our purposes.
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino/file",
      options: { destination: 1 }, // 1 = stdout (the terminal)
    },
  }),
})

export { logger }
