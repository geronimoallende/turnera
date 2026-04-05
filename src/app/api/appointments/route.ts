/**
 * API Route: /api/appointments
 *
 * GET  /api/appointments?clinic_id=xxx&date=2026-04-04
 *   → Returns appointments for a clinic, with filters for date, doctor, status
 *   → Joins doctors and clinic_patients tables so the calendar has all info
 *
 * POST /api/appointments
 *   → Creates a new appointment at a clinic
 *   → Validates role permissions (doctor needs can_create_appointments)
 *   → Supports inline patient creation (new patient + appointment in one call)
 *   → The database trigger `check_appointment_overlap` prevents double-booking
 *     (unless is_overbooking=true for entreturnos)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { withErrorHandler, ApiError } from "@/lib/error-handler"

// ─── Validation Schemas ──────────────────────────────────────────

/** Schema for GET query parameters — what the calendar sends when loading */
const listSchema = z.object({
  clinic_id: z.uuidv4(),
  // Single date (day view): "2026-04-04"
  date: z.string().optional(),
  // Date range (week/month view): start_date + end_date
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  // Optional filters
  doctor_id: z.uuidv4().optional(),
  status: z.string().optional(),
  patient_id: z.uuidv4().optional(),
})

/** Schema for POST body — the booking form data */
const createSchema = z.object({
  clinic_id: z.uuidv4(),
  doctor_id: z.uuidv4(),
  // patient_id is optional because the secretary might create a new patient inline
  patient_id: z.uuidv4().optional(),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  duration_minutes: z.coerce.number().int().min(5).max(120),
  reason: z.string().optional(),
  internal_notes: z.string().optional(),
  is_entreturno: z.boolean().optional().default(false),
  source: z
    .enum(["web", "phone", "whatsapp", "walk_in", "manual"])
    .optional()
    .default("web"),
  // Inline patient creation — if the patient doesn't exist yet,
  // the secretary can create them during booking
  new_patient: z
    .object({
      dni: z.string().min(1, "DNI is required"),
      first_name: z.string().min(1, "First name is required"),
      last_name: z.string().min(1, "Last name is required"),
      phone: z.string().optional(),
    })
    .optional(),
})

// ─── Shared: what columns to SELECT from appointments ────────────
// This string tells Supabase what data to return.
// The !inner syntax means "JOIN this table and only return appointments
// that have a matching doctor/patient" (like SQL INNER JOIN).
const APPOINTMENT_SELECT = `
  id, appointment_date, start_time, end_time, duration_minutes,
  status, reason, is_overbooking, is_entreturno, internal_notes,
  checked_in_at, started_at, completed_at,
  doctors!inner(id, first_name, last_name, specialty),
  clinic_patients!inner(id, first_name, last_name, dni, phone,
    insurance_provider, insurance_plan, no_show_count)
`

// ─── GET: List appointments for a clinic ─────────────────────────

export const GET = withErrorHandler(async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams)
  const { clinic_id, date, start_date, end_date, doctor_id, status, patient_id } =
    listSchema.parse(params)

  const supabase = await createClient()

  // Start building the query — same pattern as patients
  let query = supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .eq("clinic_id", clinic_id)

  // Date filtering — the calendar sends different params depending on the view:
  // Day view sends: ?date=2026-04-04
  // Week view sends: ?start_date=2026-03-30&end_date=2026-04-05
  // Month view sends: ?start_date=2026-04-01&end_date=2026-04-30
  if (date) {
    query = query.eq("appointment_date", date)
  } else if (start_date && end_date) {
    // gte = greater than or equal, lte = less than or equal
    query = query.gte("appointment_date", start_date).lte("appointment_date", end_date)
  }

  // Optional filters — the calendar sidebar can filter by doctor, status, etc.
  if (doctor_id) query = query.eq("doctor_id", doctor_id)
  if (status) query = query.eq("status", status)
  if (patient_id) query = query.eq("patient_id", patient_id)

  // Order by date first, then by time within each date
  query = query.order("appointment_date").order("start_time")

  const { data, error } = await query

  if (error) throw new ApiError(error.message, 500, "DB_ERROR")

  return NextResponse.json({ data })
})

// ─── POST: Create an appointment ─────────────────────────────────

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validated = createSchema.parse(body)

  const supabase = await createClient()

  // ── Step 1: Identify who is making this request ──────────────
  // We need to know: who is this user, and what's their role at this clinic?
  // This determines if they're allowed to create appointments.

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new ApiError("Unauthorized", 401, "UNAUTHORIZED")

  // Find the staff record for this auth user
  // (remember: staff table is the bridge between Supabase Auth and our app)
  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (!staff) throw new ApiError("Staff record not found", 403, "FORBIDDEN")

  // Find their role at this specific clinic
  // (a person can be admin at clinic A and secretary at clinic B)
  const { data: staffClinic } = await supabase
    .from("staff_clinics")
    .select("role")
    .eq("staff_id", staff.id)
    .eq("clinic_id", validated.clinic_id)
    .single()

  if (!staffClinic)
    throw new ApiError("Not a member of this clinic", 403, "FORBIDDEN")

  // ── Step 2: Role-based permission check for doctors ──────────
  // Admin and secretary can always create appointments.
  // Doctors can only create appointments IF:
  //   a) The appointment is for themselves (not another doctor)
  //   b) The admin has enabled can_create_appointments for them

  if (staffClinic.role === "doctor") {
    // Find which doctor record belongs to this staff member
    const { data: doctorRecord } = await supabase
      .from("doctors")
      .select("id")
      .eq("staff_id", staff.id)
      .single()

    // Check: is this doctor trying to book for themselves?
    if (!doctorRecord || doctorRecord.id !== validated.doctor_id) {
      throw new ApiError(
        "Doctors can only create appointments for themselves",
        403,
        "FORBIDDEN"
      )
    }

    // Check: did the admin enable appointment creation for this doctor?
    const { data: settings } = await supabase
      .from("doctor_clinic_settings")
      .select("can_create_appointments")
      .eq("doctor_id", validated.doctor_id)
      .eq("clinic_id", validated.clinic_id)
      .single()

    if (!settings?.can_create_appointments) {
      throw new ApiError(
        "Doctor does not have permission to create appointments",
        403,
        "FORBIDDEN"
      )
    }
  }

  // ── Step 3: Handle inline patient creation ───────────────────
  // Two scenarios:
  //   a) patient_id is provided → patient already exists, use it
  //   b) new_patient is provided → create the patient first, then use the new ID
  // This lets the secretary create a patient during booking without leaving the form.

  let patientId = validated.patient_id

  if (!patientId && validated.new_patient) {
    // Check if a patient with this DNI already exists at this clinic
    const { data: existing } = await supabase
      .from("clinic_patients")
      .select("id")
      .eq("clinic_id", validated.clinic_id)
      .eq("dni", validated.new_patient.dni)
      .maybeSingle()

    if (existing) {
      throw new ApiError(
        "Patient with this DNI already exists at this clinic",
        409,
        "DUPLICATE_DNI"
      )
    }

    // Create the new patient
    const { data: newPatient, error: patientError } = await supabase
      .from("clinic_patients")
      .insert({
        clinic_id: validated.clinic_id,
        dni: validated.new_patient.dni,
        first_name: validated.new_patient.first_name,
        last_name: validated.new_patient.last_name,
        phone: validated.new_patient.phone || null,
      })
      .select("id")
      .single()

    if (patientError) throw new ApiError(patientError.message, 500, "DB_ERROR")
    patientId = newPatient.id
  }

  // At this point we MUST have a patient ID (either existing or newly created)
  if (!patientId) {
    throw new ApiError(
      "Either patient_id or new_patient is required",
      400,
      "MISSING_PATIENT"
    )
  }

  // ── Step 4: Calculate end_time ───────────────────────────────
  // The form sends start_time ("09:30") and duration_minutes (30).
  // We need to calculate end_time ("10:00") for the database.
  //
  // We convert to total minutes, add duration, convert back to HH:MM.
  // Example: 09:30 → 570 minutes + 30 = 600 minutes → 10:00

  const [hours, minutes] = validated.start_time.split(":").map(Number)
  const startTotalMinutes = hours * 60 + minutes
  const endTotalMinutes = startTotalMinutes + validated.duration_minutes
  const endHours = Math.floor(endTotalMinutes / 60)
  const endMins = endTotalMinutes % 60
  const end_time = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`

  // ── Step 5: Insert the appointment ───────────────────────────
  // The database trigger `check_appointment_overlap` will automatically
  // check if this time slot is already taken. If it is, the INSERT fails
  // with an error message containing "overlaps".
  //
  // UNLESS is_overbooking=true (entreturno) — then the trigger skips the check.

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      clinic_id: validated.clinic_id,
      doctor_id: validated.doctor_id,
      patient_id: patientId,
      appointment_date: validated.appointment_date,
      start_time: validated.start_time,
      end_time,
      duration_minutes: validated.duration_minutes,
      status: "confirmed",
      reason: validated.reason || null,
      internal_notes: validated.internal_notes || null,
      is_overbooking: validated.is_entreturno,
      is_entreturno: validated.is_entreturno,
      source: validated.source,
      created_by: staff.id,
    })
    .select(APPOINTMENT_SELECT)
    .single()

  if (error) {
    // The overlap trigger raises an exception with "overlaps" in the message
    if (error.message.includes("overlaps")) {
      throw new ApiError(
        "This time slot is already taken. Use entreturno to overbook.",
        409,
        "SLOT_OVERLAP"
      )
    }
    throw new ApiError(error.message, 500, "DB_ERROR")
  }

  return NextResponse.json(
    { data, message: "Appointment created" },
    { status: 201 }
  )
})
