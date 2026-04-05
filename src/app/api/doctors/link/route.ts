/**
 * API Route: /api/doctors/link
 *
 * POST /api/doctors/link { doctor_id, clinic_id, slot_duration?, fee? }
 *   → Links an existing doctor to a new clinic.
 *   → Calls the link_doctor_to_clinic() DB function which atomically
 *     creates staff_clinics + doctor_clinic_settings rows.
 *   → Only admins can link doctors to their clinic.
 *
 * This is the second step of the "Add Existing Doctor" flow:
 *   1. Admin searches by email → POST /api/doctors/lookup → sees partial info
 *   2. Admin confirms → POST /api/doctors/link → doctor is now at their clinic
 *
 * In Phase 4, this will be called after a doctor accepts an invitation
 * instead of being called directly by the admin.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"
import { logger } from "@/lib/logger"

// ─── Validation Schema ───────────────────────────────────────────

const linkSchema = z.object({
  doctor_id: z.string().uuid(),
  clinic_id: z.string().uuid(),
  slot_duration: z.number().int().min(5).max(120).optional().default(30),
  fee: z.number().min(0).optional().default(0),
})

// ─── POST: Link existing doctor to a clinic ─────────────────────

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { doctor_id, clinic_id, slot_duration, fee } = linkSchema.parse(body)

  // Use the regular client so the DB function can read auth.uid()
  // and verify the caller is an admin at this clinic.
  const supabase = await createClient()

  // Call the atomic DB function.
  // It handles: permission check, duplicate check, staff_clinics + settings insert.
  const { data: result, error: rpcError } = await supabase.rpc(
    "link_doctor_to_clinic",
    {
      p_doctor_id: doctor_id,
      p_clinic_id: clinic_id,
      p_slot_duration: slot_duration,
      p_fee: fee,
    }
  )

  if (rpcError) {
    // The DB function raises specific exceptions we can surface:
    // - "Only admins can link doctors" → permission issue
    // - "Doctor not found" → bad doctor_id
    // - "Doctor is already linked" → duplicate
    const message = rpcError.message

    if (message.includes("Only admins")) {
      throw new ApiError(message, 403, "FORBIDDEN")
    }
    if (message.includes("not found")) {
      throw new ApiError(message, 404, "NOT_FOUND")
    }
    if (message.includes("already linked")) {
      throw new ApiError(message, 409, "ALREADY_LINKED")
    }

    logger.error({ doctorId: doctor_id, clinicId: clinic_id, error: message }, "link_doctor_to_clinic failed")
    throw new ApiError(`Failed to link doctor: ${message}`, 500, "DB_ERROR")
  }

  const ids = result as unknown as {
    staff_id: string
    staff_clinic_id: string
    settings_id: string
  }

  logger.info(
    { doctorId: doctor_id, clinicId: clinic_id },
    "Doctor linked to clinic successfully"
  )

  return NextResponse.json(
    {
      data: {
        doctor_id,
        staff_id: ids.staff_id,
        settings_id: ids.settings_id,
      },
      message: "Doctor linked to clinic successfully",
    },
    { status: 201 }
  )
})
