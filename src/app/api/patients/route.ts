/**
 * API Route: /api/patients
 *
 * Handles listing and creating patients for a specific clinic.
 *
 * GET  /api/patients?clinic_id=xxx&search=garcia&page=1&limit=20
 *   → Returns paginated list of patients from `clinic_patients`
 *   → No joins needed — all patient data lives in `clinic_patients` directly
 *
 * POST /api/patients
 *   → Creates a new patient record in `clinic_patients`
 *   → DNI uniqueness is checked per-clinic (same DNI can exist at different clinics)
 *
 * Both endpoints use the server Supabase client, which reads the
 * logged-in user's JWT from cookies. RLS policies ensure you can
 * only see/modify patients at clinics you belong to.
 *
 * Error handling is centralized via withErrorHandler() — no manual
 * try/catch or safeParse needed. See src/lib/error-handler.ts.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

// ─── Validation Schemas ──────────────────────────────────────────
// zod schemas define what shape the incoming data must have.
// If the data doesn't match, .parse() throws a ZodError which
// withErrorHandler() catches and returns as a 400 response.

/** Schema for GET query parameters */
const listSchema = z.object({
  clinic_id: z.uuidv4(),
  search: z.string().optional().default(""),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
})

/** Schema for POST body — all fields for creating a patient at a clinic */
const createSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dni: z.string().min(1, "DNI is required"),
  phone: z.string().optional(),
  whatsapp_same: z.boolean().optional(),
  whatsapp_phone: z.string().optional(),
  email: z.email().optional().or(z.literal("")),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_plan: z.string().optional(),
  insurance_member_number: z.string().optional(),
  notes: z.string().optional(),
  clinic_id: z.uuidv4(),
})

// ─── GET: List patients for a clinic ─────────────────────────────

export const GET = withErrorHandler(async (request: NextRequest) => {
  // 1. Parse query parameters from the URL
  //    request.nextUrl.searchParams is like URLSearchParams
  const params = Object.fromEntries(request.nextUrl.searchParams)

  // 2. Validate with zod — .parse() throws ZodError if invalid.
  //    No need for safeParse + if-check anymore — withErrorHandler
  //    catches the ZodError and returns a 400 response automatically.
  const { clinic_id, search, page, limit } = listSchema.parse(params)

  // 3. Create a server-side Supabase client (reads JWT from cookies)
  const supabase = await createClient()

  // 4. Build the query
  //    Everything is in `clinic_patients` now — no joins needed.
  //    We select all columns we need directly from one table.
  let query = supabase
    .from("clinic_patients")
    .select(
      `
      id,
      first_name,
      last_name,
      dni,
      phone,
      email,
      whatsapp_phone,
      is_active,
      blacklist_status,
      no_show_count,
      insurance_provider,
      insurance_plan,
      tags,
      notes
    `,
      { count: "exact" } // Also return total count for pagination
    )
    .eq("clinic_id", clinic_id)
    .eq("is_active", true)

  // 5. Apply search filter if provided
  //    ilike = case-insensitive LIKE (SQL pattern matching)
  //    In PostgREST's .or() filter, we use * instead of % as the wildcard
  //    because % conflicts with URL encoding (%20 = space, etc.)
  if (search) {
    // Search by first name, last name, or DNI
    // or() combines multiple conditions with OR logic
    query = query.or(
      `first_name.ilike.*${search}*,last_name.ilike.*${search}*,dni.ilike.*${search}*`
    )
  }

  // 6. Apply pagination
  //    range(from, to) is like SQL OFFSET/LIMIT
  //    Page 1 = rows 0-19, Page 2 = rows 20-39, etc.
  const from = (page - 1) * limit
  const to = from + limit - 1

  query = query
    .order("last_name", { ascending: true })
    .range(from, to)

  // 7. Execute the query
  const { data, error, count } = await query

  // If Supabase returns an error, throw ApiError.
  // withErrorHandler catches it and returns a proper 500 response.
  if (error) {
    throw new ApiError(error.message, 500, "DB_ERROR")
  }

  // 8. Return the results with pagination metadata
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
    },
  })
})

// ─── POST: Create a patient at a clinic ─────────────────────────

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 1. Parse and validate the request body
  //    .parse() throws ZodError if invalid → caught by withErrorHandler → 400
  const body = await request.json()
  const {
    first_name, last_name, dni, phone, email,
    date_of_birth, gender, insurance_provider, insurance_plan,
    insurance_member_number, notes, clinic_id,
    whatsapp_same, whatsapp_phone,
  } = createSchema.parse(body)

  const supabase = await createClient()

  // 2. Check if a patient with this DNI already exists at THIS clinic
  //    DNI uniqueness is per-clinic, not global. The same person can
  //    be registered at multiple clinics independently.
  const { data: existing } = await supabase
    .from("clinic_patients")
    .select("id")
    .eq("clinic_id", clinic_id)
    .eq("dni", dni)
    .maybeSingle()

  if (existing) {
    // Throw ApiError instead of manually building the response.
    // withErrorHandler catches it and returns { error, code, requestId } with status 409.
    throw new ApiError(
      "Patient with this DNI is already registered at this clinic",
      409,
      "DUPLICATE_DNI"
    )
  }

  // 3. Insert directly into `clinic_patients` — one step, one table
  const { data, error } = await supabase
    .from("clinic_patients")
    .insert({
      first_name,
      last_name,
      dni,
      phone: phone ?? null,
      // If "same as phone" is checked (or not specified), copy phone to whatsapp
      // Otherwise use the separate whatsapp_phone field
      whatsapp_phone: (whatsapp_same !== false ? phone : whatsapp_phone) ?? null,
      email: email || null,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      insurance_provider: insurance_provider || null,
      insurance_plan: insurance_plan || null,
      insurance_member_number: insurance_member_number || null,
      notes: notes || null,
      clinic_id,
    })
    .select()
    .single()

  if (error) {
    throw new ApiError(error.message, 500, "DB_ERROR")
  }

  return NextResponse.json(
    { data, message: "Patient created" },
    { status: 201 } // 201 = Created
  )
})
