-- Migration 018: create_doctor_at_clinic() + link_doctor_to_clinic()
--
-- WHY: Creating a doctor requires inserting into 4 tables (staff, staff_clinics,
-- doctors, doctor_clinic_settings) — all must succeed or none. Without an atomic
-- function, a failure mid-way leaves orphan records. These SECURITY DEFINER
-- functions bypass RLS to insert across tables, but verify the caller is an admin
-- at the target clinic before proceeding.
--
-- NOTE: Auth user creation is NOT handled here. The API route creates the auth
-- user via supabase.auth.admin.createUser() first, then passes the auth_user_id
-- to create_doctor_at_clinic(). If this function fails, the API route cleans up
-- the auth user. This separation follows Supabase best practices — GoTrue manages
-- auth, PostgreSQL manages relational data.

-- ─── Function 1: create_doctor_at_clinic ────────────────────────────
--
-- Creates a new doctor from scratch: staff + staff_clinics + doctors + doctor_clinic_settings.
-- Called by POST /api/doctors after the auth user has been created.
--
-- Parameters:
--   p_auth_user_id  — UUID from auth.users (created by the API route)
--   p_first_name    — Doctor's first name
--   p_last_name     — Doctor's last name
--   p_email         — Doctor's email (stored in staff, used for lookups)
--   p_phone         — Doctor's phone (optional)
--   p_specialty     — e.g. "Cardiología", "Traumatología"
--   p_license_number — Medical license ("matrícula")
--   p_clinic_id     — Which clinic is adding this doctor
--   p_slot_duration  — Default appointment length in minutes (e.g. 30)
--   p_fee           — Consultation fee at this clinic
--
-- Returns: JSON with the IDs of all created records

CREATE OR REPLACE FUNCTION public.create_doctor_at_clinic(
  p_auth_user_id UUID,
  p_first_name TEXT,
  p_last_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_specialty TEXT DEFAULT NULL,
  p_license_number TEXT DEFAULT NULL,
  p_clinic_id UUID DEFAULT NULL,
  p_slot_duration INTEGER DEFAULT 30,
  p_fee NUMERIC(10,2) DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id UUID;
  v_doctor_id UUID;
  v_settings_id UUID;
  v_staff_clinic_id UUID;
  v_caller_role staff_role;
BEGIN
  -- ── Step 1: Verify the caller is an admin at this clinic ──────────
  -- get_user_role() reads auth.uid() internally, so the caller must be
  -- authenticated. If they're not an admin, we block the operation.
  v_caller_role := get_user_role(p_clinic_id);

  IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can create doctors. Your role: %', COALESCE(v_caller_role::TEXT, 'none');
  END IF;

  -- ── Step 2: Create the staff record ───────────────────────────────
  -- staff is the global identity table. Every person who logs in has one.
  -- auth_user_id links it to the Supabase auth.users record.
  INSERT INTO staff (auth_user_id, first_name, last_name, email, phone)
  VALUES (p_auth_user_id, p_first_name, p_last_name, p_email, p_phone)
  RETURNING id INTO v_staff_id;

  -- ── Step 3: Link staff to the clinic with role 'doctor' ───────────
  -- staff_clinics is the junction table that says "this person works at
  -- this clinic with this role". One person can work at multiple clinics.
  INSERT INTO staff_clinics (staff_id, clinic_id, role)
  VALUES (v_staff_id, p_clinic_id, 'doctor')
  RETURNING id INTO v_staff_clinic_id;

  -- ── Step 4: Create the doctor profile ─────────────────────────────
  -- doctors stores medical-specific info (specialty, license). It's
  -- linked 1:1 to staff via staff_id.
  INSERT INTO doctors (staff_id, specialty, license_number)
  VALUES (v_staff_id, p_specialty, p_license_number)
  RETURNING id INTO v_doctor_id;

  -- ── Step 5: Create per-clinic settings ────────────────────────────
  -- doctor_clinic_settings stores how this doctor operates at THIS clinic
  -- (slot duration, fee, overbooking rules). Different clinics can have
  -- different settings for the same doctor.
  INSERT INTO doctor_clinic_settings (doctor_id, clinic_id, default_slot_duration_minutes, consultation_fee)
  VALUES (v_doctor_id, p_clinic_id, p_slot_duration, p_fee)
  RETURNING id INTO v_settings_id;

  -- ── Return all created IDs ────────────────────────────────────────
  -- The API route uses these to confirm success and return to the frontend.
  RETURN jsonb_build_object(
    'staff_id', v_staff_id,
    'staff_clinic_id', v_staff_clinic_id,
    'doctor_id', v_doctor_id,
    'settings_id', v_settings_id
  );
END;
$$;

-- Grant execute to authenticated users (RLS + internal check handle permissions)
GRANT EXECUTE ON FUNCTION public.create_doctor_at_clinic TO authenticated;


-- ─── Function 2: link_doctor_to_clinic ──────────────────────────────
--
-- Links an EXISTING doctor to a new clinic. The doctor already has a
-- staff record and a doctors record — we just need to add:
--   1. A new staff_clinics row (so they appear at the new clinic)
--   2. A new doctor_clinic_settings row (clinic-specific config)
--
-- Called by POST /api/doctors/link. In Phase 1 this is called directly
-- by an admin. In Phase 4, it will be called after a doctor accepts an
-- invitation (from the doctor_invitations table).
--
-- Parameters:
--   p_doctor_id     — UUID from doctors table
--   p_clinic_id     — Which clinic is adding this doctor
--   p_slot_duration  — Default appointment length at this clinic
--   p_fee           — Consultation fee at this clinic
--
-- Returns: JSON with the IDs of created records

CREATE OR REPLACE FUNCTION public.link_doctor_to_clinic(
  p_doctor_id UUID,
  p_clinic_id UUID,
  p_slot_duration INTEGER DEFAULT 30,
  p_fee NUMERIC(10,2) DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_id UUID;
  v_staff_clinic_id UUID;
  v_settings_id UUID;
  v_caller_role staff_role;
  v_existing_link UUID;
BEGIN
  -- ── Step 1: Verify the caller is an admin at this clinic ──────────
  v_caller_role := get_user_role(p_clinic_id);

  IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can link doctors to clinics. Your role: %', COALESCE(v_caller_role::TEXT, 'none');
  END IF;

  -- ── Step 2: Look up the doctor's staff_id ─────────────────────────
  -- Every doctor has exactly one staff record (1:1 via doctors.staff_id).
  -- We need the staff_id to create the staff_clinics row.
  SELECT staff_id INTO v_staff_id
  FROM doctors
  WHERE id = p_doctor_id;

  IF v_staff_id IS NULL THEN
    RAISE EXCEPTION 'Doctor not found: %', p_doctor_id;
  END IF;

  -- ── Step 3: Check if already linked ───────────────────────────────
  -- staff_clinics has a UNIQUE(staff_id, clinic_id) constraint. Instead
  -- of letting the constraint throw a cryptic error, we check first and
  -- return a clear message.
  SELECT id INTO v_existing_link
  FROM staff_clinics
  WHERE staff_id = v_staff_id AND clinic_id = p_clinic_id;

  IF v_existing_link IS NOT NULL THEN
    RAISE EXCEPTION 'Doctor is already linked to this clinic';
  END IF;

  -- ── Step 4: Create the staff_clinics row ──────────────────────────
  INSERT INTO staff_clinics (staff_id, clinic_id, role)
  VALUES (v_staff_id, p_clinic_id, 'doctor')
  RETURNING id INTO v_staff_clinic_id;

  -- ── Step 5: Create per-clinic settings ────────────────────────────
  INSERT INTO doctor_clinic_settings (doctor_id, clinic_id, default_slot_duration_minutes, consultation_fee)
  VALUES (p_doctor_id, p_clinic_id, p_slot_duration, p_fee)
  RETURNING id INTO v_settings_id;

  -- ── Return created IDs ────────────────────────────────────────────
  RETURN jsonb_build_object(
    'staff_id', v_staff_id,
    'staff_clinic_id', v_staff_clinic_id,
    'settings_id', v_settings_id
  );
END;
$$;

-- Grant execute to authenticated users (RLS + internal check handle permissions)
GRANT EXECUTE ON FUNCTION public.link_doctor_to_clinic TO authenticated;


-- ─── Comments ───────────────────────────────────────────────────────
-- These help other developers understand the functions when browsing
-- the database with tools like Supabase Studio or pgAdmin.

COMMENT ON FUNCTION public.create_doctor_at_clinic IS
  'Atomically creates staff + staff_clinics + doctors + doctor_clinic_settings for a new doctor. '
  'Auth user must be created first via Supabase Admin API. Only callable by clinic admins.';

COMMENT ON FUNCTION public.link_doctor_to_clinic IS
  'Links an existing doctor to a new clinic by creating staff_clinics + doctor_clinic_settings. '
  'Only callable by clinic admins. Phase 1: direct call. Phase 4: after invitation acceptance.';
