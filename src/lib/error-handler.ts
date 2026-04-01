import { NextRequest, NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { logger } from "@/lib/logger"
import { ZodError } from "zod"

/**
 * Centralized error handler wrapper for API routes.
 *
 * PROBLEM: Every API route has its own try/catch with slightly different
 * error formatting. Errors aren't logged or reported to Sentry.
 *
 * SOLUTION: Wrap every route with withErrorHandler(). It:
 * 1. Catches all errors in one place
 * 2. Classifies them (validation, auth, conflict, server error)
 * 3. Logs them with Pino (structured JSON)
 * 4. Reports unknown errors to Sentry (error tracking)
 * 5. Returns a consistent response shape: { error, code, requestId }
 *
 * BEFORE (duplicated in every route):
 *
 *   export async function GET(request: NextRequest) {
 *     const parsed = schema.safeParse(params)
 *     if (!parsed.success) {
 *       return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
 *     }
 *     // ... more error handling ...
 *   }
 *
 * AFTER (clean, errors handled automatically):
 *
 *   export const GET = withErrorHandler(async (request) => {
 *     const data = schema.parse(params)  // throws ZodError if invalid → caught by wrapper
 *     // ... just write the happy path, errors are caught automatically
 *   })
 */

// ─── Types ──────────────────────────────────────────────────────────

/**
 * The shape of an API route handler function.
 *
 * NextRequest = the incoming HTTP request (URL, headers, body, cookies).
 * The second parameter (context) contains dynamic route params.
 * For example, in /api/doctors/[id]/route.ts, context.params has { id: "abc-123" }.
 *
 * The Promise<Record<string, string>> is because in Next.js 16,
 * params is a Promise that must be awaited (it wasn't in older versions).
 */
type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

// ─── Helper: Generate Request ID ────────────────────────────────────

/**
 * Creates a short unique ID for each request.
 *
 * WHY: When a user reports "something broke," you ask them for the requestId
 * (shown in the error response). Then you search your logs for that ID
 * and find EVERY log line related to that specific request.
 *
 * crypto.randomUUID() generates a full UUID like "a1b2c3d4-e5f6-7890-abcd-ef1234567890".
 * We take only the first 8 characters ("a1b2c3d4") because that's unique enough
 * for debugging and easier to communicate over the phone.
 */
function generateRequestId(): string {
  return crypto.randomUUID().slice(0, 8)
}

// ─── Custom Error Class ─────────────────────────────────────────────

/**
 * Custom error class for API errors with HTTP status codes.
 *
 * JavaScript's built-in Error class only has a message.
 * We need two more things:
 *   - statusCode: what HTTP status to return (404, 409, 500, etc.)
 *   - code: a machine-readable error code ("NOT_FOUND", "DUPLICATE_DNI")
 *
 * USAGE in your route handlers:
 *   throw new ApiError("Patient not found", 404, "NOT_FOUND")
 *   throw new ApiError("DNI already exists at this clinic", 409, "DUPLICATE_DNI")
 *   throw new ApiError("Unauthorized", 403, "FORBIDDEN")
 *
 * The wrapper catches this and returns:
 *   { error: "Patient not found", code: "NOT_FOUND", requestId: "a1b2c3d4" }
 *   with HTTP status 404.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR"
  ) {
    // super(message) calls the parent Error class constructor.
    // This sets this.message = message.
    super(message)
    // this.name helps identify the error type in stack traces.
    this.name = "ApiError"
  }
}

// ─── The Wrapper Function ───────────────────────────────────────────

/**
 * Wraps an API route handler with centralized error handling.
 *
 * HOW IT WORKS:
 * withErrorHandler takes a function (your route handler) and returns
 * a NEW function that:
 *   1. Generates a requestId
 *   2. Runs your handler inside a try/catch
 *   3. If your handler succeeds → logs the request and returns the response
 *   4. If your handler throws → classifies the error and returns the right response
 *
 * This is a pattern called "higher-order function" — a function that takes
 * a function as input and returns a new function as output. Like wrapping
 * a gift: the gift (your handler) is inside, the wrapper adds features.
 */
export function withErrorHandler(handler: RouteHandler): RouteHandler {
  // This returns a NEW function that Next.js will call when a request comes in.
  // The original handler is "captured" inside this function (this is called a "closure").
  return async (request, context) => {
    // ── Setup: things we track for every request ──────────────────
    const requestId = generateRequestId()
    const startTime = Date.now()         // Current time in milliseconds
    const method = request.method        // "GET", "POST", "PUT", "DELETE"
    const url = request.nextUrl.pathname // "/api/patients", "/api/doctors/abc"

    try {
      // ── Run the actual route handler ────────────────────────────
      // If it throws any error, we jump to the catch block below.
      const response = await handler(request, context)

      // ── Success: log the request ───────────────────────────────
      // Date.now() - startTime = how many milliseconds the request took.
      const duration = Date.now() - startTime
      logger.info(
        { requestId, method, url, status: response.status, duration },
        "API request completed"
      )

      return response

    } catch (error) {
      // ── Something went wrong — classify and handle ─────────────
      const duration = Date.now() - startTime

      // ── Case 1: ZodError (input validation failed) ─────────────
      // This happens when you call schema.parse() and the data doesn't
      // match the schema. For example, clinic_id is missing or not a UUID.
      // We return 400 (Bad Request) because the CLIENT sent bad data.
      if (error instanceof ZodError) {
        logger.warn(
          { requestId, method, url, duration, issues: error.issues },
          "Validation error"
        )
        return NextResponse.json(
          {
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            requestId,
            details: error.issues,
          },
          { status: 400 }
        )
      }

      // ── Case 2: ApiError (thrown intentionally by our code) ─────
      // This is a KNOWN error — we threw it on purpose.
      // Example: throw new ApiError("Patient not found", 404, "NOT_FOUND")
      // We use the statusCode and code from the error.
      if (error instanceof ApiError) {
        logger.warn(
          { requestId, method, url, duration, code: error.code },
          error.message
        )
        return NextResponse.json(
          { error: error.message, code: error.code, requestId },
          { status: error.statusCode }
        )
      }

      // ── Case 3: Unknown error (something we didn't expect) ─────
      // This is a BUG — something crashed that we didn't handle.
      // We log it as an error (not warning) and REPORT TO SENTRY
      // because we need to investigate and fix it.
      // We return 500 (Internal Server Error) — it's our fault, not the client's.
      // We DON'T send the real error message to the client (security risk —
      // it might contain database details or internal paths).
      const message = error instanceof Error ? error.message : "Unknown error"

      logger.error(
        { requestId, method, url, duration, error: message },
        "Unhandled API error"
      )

      // Report to Sentry with context tags so we can filter in the dashboard
      Sentry.captureException(error, {
        tags: { requestId, method, url },
      })

      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR", requestId },
        { status: 500 }
      )
    }
  }
}
