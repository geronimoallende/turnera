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
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// ─── Validation Schemas ──────────────────────────────────────────
// zod schemas define what shape the incoming data must have.
// If the data doesn't match, we return a 400 error immediately
// instead of letting bad data reach the database.

/** Schema for GET query parameters */
const listSchema = z.object({
  clinic_id: z.uuid(),
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
  clinic_id: z.uuid(),
})

// ─── GET: List patients for a clinic ─────────────────────────────

export async function GET(request: NextRequest) {
  // 1. Parse query parameters from the URL
  //    request.nextUrl.searchParams is like URLSearchParams
  const params = Object.fromEntries(request.nextUrl.searchParams)

  // 2. Validate with zod — safeParse returns { success, data, error }
  //    instead of throwing an exception
  const parsed = listSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 }
    )
  }

  const { clinic_id, search, page, limit } = parsed.data

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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
}

// ─── POST: Create a patient at a clinic ─────────────────────────

export async function POST(request: NextRequest) {
  // 1. Parse and validate the request body
  const body = await request.json()
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 }
    )
  }

  const { first_name, last_name, dni, phone, clinic_id } = parsed.data

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
    return NextResponse.json(
      { error: "Patient with this DNI is already registered at this clinic" },
      { status: 409 } // 409 = Conflict
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
      clinic_id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { data, message: "Patient created" },
    { status: 201 } // 201 = Created
  )
}
