/**
 * API Route: /api/patients/[id]
 *
 * Handles fetching and updating a single patient.
 *
 * GET  /api/patients/[id]?clinic_id=xxx
 *   → Returns patient data directly from `clinic_patients`
 *   → No joins needed — all data lives in one table
 *
 * PUT  /api/patients/[id]
 *   → Updates the `clinic_patients` record directly
 *   → All fields (including DNI) are editable
 *
 * The [id] in the folder name is a "dynamic segment" — Next.js
 * extracts it from the URL. So /api/patients/abc-123 gives you
 * params.id = "abc-123" (the clinic_patients row UUID).
 *
 * Error handling is centralized via withErrorHandler() — no manual
 * try/catch or safeParse needed. See src/lib/error-handler.ts.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

// ─── Validation Schemas ──────────────────────────────────────────

/** Schema for PUT body — all updatable fields on clinic_patients */
const updateSchema = z.object({
  clinic_id: z.uuid(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  dni: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  whatsapp_phone: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  blood_type: z.string().nullable().optional(),
  allergies: z.string().nullable().optional(),
  insurance_provider: z.string().nullable().optional(),
  insurance_plan: z.string().nullable().optional(),
  insurance_member_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
})

// ─── GET: Fetch a single patient ─────────────────────────────────

export const GET = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  // In Next.js 16, params is a Promise — we must await it.
  // context?.params contains the dynamic route segments.
  // For /api/patients/[id], it has { id: "the-uuid" }.
  const { id } = await context!.params

  // Read clinic_id from query params
  const clinic_id = request.nextUrl.searchParams.get("clinic_id")
  if (!clinic_id) {
    throw new ApiError("clinic_id query parameter is required", 400, "MISSING_PARAM")
  }

  const supabase = await createClient()

  // Fetch directly from clinic_patients — no joins needed.
  // The [id] from the URL IS the clinic_patients.id,
  // but we still filter by clinic_id for RLS safety.
  const { data, error } = await supabase
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
      date_of_birth,
      gender,
      blood_type,
      allergies,
      is_active,
      blacklist_status,
      no_show_count,
      insurance_provider,
      insurance_plan,
      insurance_member_number,
      notes,
      tags,
      patient_type,
      financial_status
    `
    )
    .eq("clinic_id", clinic_id)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new ApiError(error.message, 500, "DB_ERROR")
  }

  if (!data) {
    throw new ApiError("Patient not found at this clinic", 404, "NOT_FOUND")
  }

  return NextResponse.json({ data })
})

// ─── PUT: Update a patient ───────────────────────────────────────

export const PUT = withErrorHandler(async (
  request: NextRequest,
  context
) => {
  const { id } = await context!.params

  // 1. Parse and validate the body
  //    .parse() throws ZodError if invalid → caught by withErrorHandler → 400
  const body = await request.json()
  const { clinic_id, ...updateData } = updateSchema.parse(body)

  // 2. If nothing to update, return early
  if (Object.keys(updateData).length === 0) {
    throw new ApiError("No fields to update", 400, "NO_FIELDS")
  }

  const supabase = await createClient()

  // 3. If DNI is being changed, check it doesn't conflict with
  //    another patient at the same clinic
  if (updateData.dni) {
    const { data: conflict } = await supabase
      .from("clinic_patients")
      .select("id")
      .eq("clinic_id", clinic_id)
      .eq("dni", updateData.dni)
      .neq("id", id) // Exclude the current record
      .maybeSingle()

    if (conflict) {
      throw new ApiError(
        "Another patient at this clinic already has this DNI",
        409,
        "DUPLICATE_DNI"
      )
    }
  }

  // 4. Update the clinic_patients record directly — one table, one step
  const { error: updateError } = await supabase
    .from("clinic_patients")
    .update(updateData)
    .eq("id", id)
    .eq("clinic_id", clinic_id)

  if (updateError) {
    throw new ApiError(updateError.message, 500, "DB_ERROR")
  }

  // 5. Re-fetch the updated record to return the latest data
  const { data, error } = await supabase
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
      date_of_birth,
      gender,
      blood_type,
      allergies,
      is_active,
      blacklist_status,
      no_show_count,
      insurance_provider,
      insurance_plan,
      insurance_member_number,
      notes,
      tags,
      patient_type,
      financial_status
    `
    )
    .eq("id", id)
    .eq("clinic_id", clinic_id)
    .single()

  if (error) {
    throw new ApiError(error.message, 500, "DB_ERROR")
  }

  return NextResponse.json({ data })
})
