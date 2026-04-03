-- ============================================================================
-- BASELINE MIGRATION: Turnera Medical Appointment Scheduling SaaS
-- ============================================================================
-- This file represents the complete database schema as of 2026-04-02.
-- It is a baseline snapshot — all prior incremental migrations are consolidated
-- here into a single, reproducible DDL script.
--
-- Order: Extensions > Enums > Tables > Primary Keys > Foreign Keys >
--        Unique Constraints > Indexes > Functions > Triggers > RLS > Realtime
-- ============================================================================


-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;


-- ============================================================================
-- 2. ENUM TYPES
-- ============================================================================

CREATE TYPE public.appointment_modality AS ENUM ('in_person', 'virtual');
CREATE TYPE public.appointment_source   AS ENUM ('web', 'phone', 'whatsapp', 'chatbot', 'walk_in', 'manual');
CREATE TYPE public.appointment_status   AS ENUM ('scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'no_show', 'cancelled_patient', 'cancelled_doctor', 'rescheduled');
CREATE TYPE public.audit_action         AS ENUM ('created', 'confirmed', 'cancelled', 'rescheduled', 'status_changed', 'payment_changed', 'updated');
CREATE TYPE public.blacklist_status     AS ENUM ('none', 'warned', 'blacklisted');
CREATE TYPE public.insurance_auth_status AS ENUM ('pending', 'approved', 'denied', 'not_required');
CREATE TYPE public.override_type        AS ENUM ('block', 'available');
CREATE TYPE public.payment_status       AS ENUM ('pending', 'paid', 'partial', 'waived');
CREATE TYPE public.reminder_channel     AS ENUM ('whatsapp', 'email', 'sms');
CREATE TYPE public.reminder_status      AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');
CREATE TYPE public.reminder_type        AS ENUM ('confirmation_request', 'reminder_24h', 'reminder_sameday', 'post_consultation', 'custom');
CREATE TYPE public.staff_role           AS ENUM ('admin', 'doctor', 'secretary');
CREATE TYPE public.waitlist_status      AS ENUM ('waiting', 'offered', 'booked', 'expired', 'cancelled');
CREATE TYPE public.waitlist_urgency     AS ENUM ('urgent', 'standard', 'flexible');


-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- 3.1 clinics — tenant configuration
CREATE TABLE IF NOT EXISTS public.clinics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  address text,
  phone text,
  email text,
  timezone text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires'::text,
  business_hours jsonb DEFAULT '{}'::jsonb,
  cancellation_policy_hours integer DEFAULT 24,
  cancellation_fee_amount numeric(10,2) DEFAULT 0,
  logo_url text,
  whatsapp_number text,
  whatsapp_phone_number_id text,
  whatsapp_waba_id text,
  whatsapp_business_id text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  max_booking_days_ahead integer NOT NULL DEFAULT 60,
  min_booking_hours_ahead integer NOT NULL DEFAULT 2,
  whatsapp_connected_at timestamp with time zone,
  whatsapp_status text DEFAULT 'not_connected'::text,
  ycloud_api_key text,
  CONSTRAINT clinics_pkey PRIMARY KEY (id)
);

-- 3.2 staff — staff identity (global, not per-clinic)
CREATE TABLE IF NOT EXISTS public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_pkey PRIMARY KEY (id)
);

-- 3.3 staff_clinics — staff <-> clinic junction with role
CREATE TABLE IF NOT EXISTS public.staff_clinics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  role staff_role NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_clinics_pkey PRIMARY KEY (id)
);

-- 3.4 doctors — doctor profile (global)
CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  specialty text,
  license_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctors_pkey PRIMARY KEY (id)
);

-- 3.5 doctor_clinic_settings — per-clinic doctor configuration
CREATE TABLE IF NOT EXISTS public.doctor_clinic_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  default_slot_duration_minutes integer NOT NULL DEFAULT 30,
  max_daily_appointments integer DEFAULT 20,
  allows_overbooking boolean DEFAULT false,
  max_overbooking_slots integer DEFAULT 2,
  consultation_fee numeric(10,2) DEFAULT 0,
  virtual_enabled boolean DEFAULT false,
  virtual_link text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctor_clinic_settings_pkey PRIMARY KEY (id)
);

-- 3.6 clinic_patients — all patient data per clinic
CREATE TABLE IF NOT EXISTS public.clinic_patients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  dni text,
  phone text,
  email text,
  whatsapp_phone text,
  date_of_birth date,
  gender text,
  blood_type text,
  allergies text,
  blacklist_status blacklist_status NOT NULL DEFAULT 'none'::blacklist_status,
  no_show_count integer NOT NULL DEFAULT 0,
  insurance_provider text,
  insurance_plan text,
  insurance_member_number text,
  patient_type text DEFAULT 'regular'::text,
  frequency text DEFAULT 'first_time'::text,
  priority text DEFAULT 'standard'::text,
  financial_status text DEFAULT 'up_to_date'::text,
  tags text[] DEFAULT '{}'::text[],
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinic_patients_pkey PRIMARY KEY (id)
);

-- 3.7 doctor_schedules — weekly recurring availability
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  day_of_week integer NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 30,
  is_active boolean DEFAULT true,
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctor_schedules_pkey PRIMARY KEY (id)
);

-- 3.8 schedule_overrides — one-off exceptions (vacations, sick days)
CREATE TABLE IF NOT EXISTS public.schedule_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  override_date date NOT NULL,
  start_time time without time zone,
  end_time time without time zone,
  override_type override_type NOT NULL DEFAULT 'block'::override_type,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT schedule_overrides_pkey PRIMARY KEY (id)
);

-- 3.9 appointments — core appointment table
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  appointment_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status appointment_status NOT NULL DEFAULT 'scheduled'::appointment_status,
  modality appointment_modality NOT NULL DEFAULT 'in_person'::appointment_modality,
  source appointment_source NOT NULL DEFAULT 'web'::appointment_source,
  reason text,
  doctor_notes text,
  internal_notes text,
  pre_consultation_instructions text,
  confirmation_sent_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  reminder_24h_sent_at timestamp with time zone,
  reminder_sameday_sent_at timestamp with time zone,
  is_overbooking boolean DEFAULT false,
  is_emergency boolean DEFAULT false,
  recurrence_rule text,
  recurrence_parent_id uuid,
  cancelled_at timestamp with time zone,
  cancellation_reason text,
  cancellation_fee_applied boolean DEFAULT false,
  rescheduled_to_id uuid,
  rescheduled_from_id uuid,
  payment_status payment_status NOT NULL DEFAULT 'pending'::payment_status,
  payment_updated_by uuid,
  payment_updated_at timestamp with time zone,
  is_invoiced boolean DEFAULT false,
  invoice_number text,
  insurance_auth_status insurance_auth_status DEFAULT 'not_required'::insurance_auth_status,
  checked_in_at timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  actual_duration_minutes integer,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id)
);

-- 3.10 waitlist — patients waiting for openings
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  doctor_id uuid,
  preferred_date_start date,
  preferred_date_end date,
  preferred_time_start time without time zone,
  preferred_time_end time without time zone,
  urgency waitlist_urgency NOT NULL DEFAULT 'standard'::waitlist_urgency,
  status waitlist_status NOT NULL DEFAULT 'waiting'::waitlist_status,
  notes text,
  offered_appointment_id uuid,
  offered_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT waitlist_pkey PRIMARY KEY (id)
);

-- 3.11 appointment_history — immutable audit log for appointments
CREATE TABLE IF NOT EXISTS public.appointment_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  action audit_action NOT NULL,
  old_values jsonb,
  new_values jsonb,
  performed_by uuid,
  performed_by_source text DEFAULT 'web_app'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointment_history_pkey PRIMARY KEY (id)
);

-- 3.12 reminders — outbound communication tracking
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  reminder_type reminder_type NOT NULL,
  channel reminder_channel NOT NULL DEFAULT 'whatsapp'::reminder_channel,
  status reminder_status NOT NULL DEFAULT 'pending'::reminder_status,
  response text,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  read_at timestamp with time zone,
  failed_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reminders_pkey PRIMARY KEY (id)
);

-- 3.13 clinic_faqs — admin-managed FAQ entries per clinic (for RAG)
CREATE TABLE IF NOT EXISTS public.clinic_faqs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinic_faqs_pkey PRIMARY KEY (id)
);

-- 3.14 clinic_services — services offered per clinic (for RAG + future billing)
CREATE TABLE IF NOT EXISTS public.clinic_services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  duration_minutes integer DEFAULT 30,
  price numeric(10,2),
  requires_preparation boolean DEFAULT false,
  preparation_instructions text,
  insurance_covered boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinic_services_pkey PRIMARY KEY (id)
);

-- 3.15 document_embeddings — pgvector store for RAG (clinic-scoped)
CREATE TABLE IF NOT EXISTS public.document_embeddings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  source_type text NOT NULL,
  source_id uuid,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_embeddings_pkey PRIMARY KEY (id)
);

-- 3.16 conversation_sessions — completed WhatsApp conversations (analytics)
CREATE TABLE IF NOT EXISTS public.conversation_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_phone text NOT NULL,
  patient_id uuid,
  started_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone,
  message_count integer DEFAULT 0,
  outcome text,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_sessions_pkey PRIMARY KEY (id)
);

-- 3.17 patient_history — immutable audit log for patient changes
CREATE TABLE IF NOT EXISTS public.patient_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  performed_by uuid,
  performed_by_role text,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT patient_history_pkey PRIMARY KEY (id)
);


-- ============================================================================
-- 4. FOREIGN KEYS
-- ============================================================================

-- staff
ALTER TABLE public.staff
  ADD CONSTRAINT staff_auth_user_id_fkey
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- staff_clinics
ALTER TABLE public.staff_clinics
  ADD CONSTRAINT staff_clinics_staff_id_fkey
  FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;

ALTER TABLE public.staff_clinics
  ADD CONSTRAINT staff_clinics_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

-- doctors
ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_staff_id_fkey
  FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;

-- doctor_clinic_settings
ALTER TABLE public.doctor_clinic_settings
  ADD CONSTRAINT doctor_clinic_settings_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;

ALTER TABLE public.doctor_clinic_settings
  ADD CONSTRAINT doctor_clinic_settings_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

-- clinic_patients
ALTER TABLE public.clinic_patients
  ADD CONSTRAINT clinic_patients_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

-- doctor_schedules
ALTER TABLE public.doctor_schedules
  ADD CONSTRAINT doctor_schedules_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;

ALTER TABLE public.doctor_schedules
  ADD CONSTRAINT doctor_schedules_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

-- schedule_overrides
ALTER TABLE public.schedule_overrides
  ADD CONSTRAINT schedule_overrides_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES public.doctors(id) ON DELETE CASCADE;

ALTER TABLE public.schedule_overrides
  ADD CONSTRAINT schedule_overrides_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

-- appointments
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.clinic_patients(id);

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.staff(id);

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_payment_updated_by_fkey
  FOREIGN KEY (payment_updated_by) REFERENCES public.staff(id);

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_rescheduled_from_id_fkey
  FOREIGN KEY (rescheduled_from_id) REFERENCES public.appointments(id);

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_rescheduled_to_id_fkey
  FOREIGN KEY (rescheduled_to_id) REFERENCES public.appointments(id);

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_recurrence_parent_id_fkey
  FOREIGN KEY (recurrence_parent_id) REFERENCES public.appointments(id);

-- waitlist
ALTER TABLE public.waitlist
  ADD CONSTRAINT waitlist_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

ALTER TABLE public.waitlist
  ADD CONSTRAINT waitlist_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.clinic_patients(id);

ALTER TABLE public.waitlist
  ADD CONSTRAINT waitlist_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES public.doctors(id);

ALTER TABLE public.waitlist
  ADD CONSTRAINT waitlist_offered_appointment_id_fkey
  FOREIGN KEY (offered_appointment_id) REFERENCES public.appointments(id);

-- appointment_history
ALTER TABLE public.appointment_history
  ADD CONSTRAINT appointment_history_appointment_id_fkey
  FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;

ALTER TABLE public.appointment_history
  ADD CONSTRAINT appointment_history_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

ALTER TABLE public.appointment_history
  ADD CONSTRAINT appointment_history_performed_by_fkey
  FOREIGN KEY (performed_by) REFERENCES public.staff(id);

-- reminders
ALTER TABLE public.reminders
  ADD CONSTRAINT reminders_appointment_id_fkey
  FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;

ALTER TABLE public.reminders
  ADD CONSTRAINT reminders_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

ALTER TABLE public.reminders
  ADD CONSTRAINT reminders_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.clinic_patients(id);

-- clinic_faqs
ALTER TABLE public.clinic_faqs
  ADD CONSTRAINT clinic_faqs_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

-- clinic_services
ALTER TABLE public.clinic_services
  ADD CONSTRAINT clinic_services_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

-- document_embeddings
ALTER TABLE public.document_embeddings
  ADD CONSTRAINT document_embeddings_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

-- conversation_sessions
ALTER TABLE public.conversation_sessions
  ADD CONSTRAINT conversation_sessions_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

ALTER TABLE public.conversation_sessions
  ADD CONSTRAINT conversation_sessions_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.clinic_patients(id);

-- patient_history
ALTER TABLE public.patient_history
  ADD CONSTRAINT patient_history_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.clinic_patients(id) ON DELETE CASCADE;

ALTER TABLE public.patient_history
  ADD CONSTRAINT patient_history_clinic_id_fkey
  FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;

ALTER TABLE public.patient_history
  ADD CONSTRAINT patient_history_performed_by_fkey
  FOREIGN KEY (performed_by) REFERENCES public.staff(id);


-- ============================================================================
-- 5. UNIQUE CONSTRAINTS
-- ============================================================================

ALTER TABLE public.clinic_patients
  ADD CONSTRAINT clinic_patients_clinic_dni_unique UNIQUE (clinic_id, dni);

ALTER TABLE public.clinics
  ADD CONSTRAINT clinics_slug_key UNIQUE (slug);

ALTER TABLE public.doctor_clinic_settings
  ADD CONSTRAINT doctor_clinic_settings_doctor_id_clinic_id_key UNIQUE (doctor_id, clinic_id);

ALTER TABLE public.doctors
  ADD CONSTRAINT doctors_staff_id_key UNIQUE (staff_id);

ALTER TABLE public.staff
  ADD CONSTRAINT staff_auth_user_id_key UNIQUE (auth_user_id);

ALTER TABLE public.staff_clinics
  ADD CONSTRAINT staff_clinics_staff_id_clinic_id_key UNIQUE (staff_id, clinic_id);


-- ============================================================================
-- 6. INDEXES
-- ============================================================================

-- appointment_history
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment ON public.appointment_history USING btree (appointment_id);

-- appointments
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON public.appointments USING btree (clinic_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments USING btree (doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments USING btree (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments USING btree (clinic_id, status);

-- clinic_faqs
CREATE INDEX IF NOT EXISTS idx_clinic_faqs_clinic ON public.clinic_faqs USING btree (clinic_id);

-- clinic_patients
CREATE INDEX IF NOT EXISTS idx_clinic_patients_clinic ON public.clinic_patients USING btree (clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_patients_dni ON public.clinic_patients USING btree (clinic_id, dni);
CREATE INDEX IF NOT EXISTS idx_clinic_patients_name ON public.clinic_patients USING btree (clinic_id, last_name, first_name);

-- clinic_services
CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic ON public.clinic_services USING btree (clinic_id);

-- conversation_sessions
CREATE INDEX IF NOT EXISTS idx_conv_sessions_clinic ON public.conversation_sessions USING btree (clinic_id);
CREATE INDEX IF NOT EXISTS idx_conv_sessions_patient ON public.conversation_sessions USING btree (patient_id);
CREATE INDEX IF NOT EXISTS idx_conv_sessions_phone ON public.conversation_sessions USING btree (clinic_id, patient_phone);

-- doctor_clinic_settings
CREATE INDEX IF NOT EXISTS idx_doctor_clinic_settings_clinic ON public.doctor_clinic_settings USING btree (clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctor_clinic_settings_doctor ON public.doctor_clinic_settings USING btree (doctor_id);

-- doctor_schedules
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_lookup ON public.doctor_schedules USING btree (doctor_id, clinic_id, day_of_week);

-- document_embeddings (HNSW index for pgvector similarity search)
CREATE INDEX IF NOT EXISTS idx_embeddings_clinic_hnsw ON public.document_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX IF NOT EXISTS idx_embeddings_clinic_id ON public.document_embeddings USING btree (clinic_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_clinic_source ON public.document_embeddings USING btree (clinic_id, source_type);

-- reminders
CREATE INDEX IF NOT EXISTS idx_reminders_appointment ON public.reminders USING btree (appointment_id);

-- schedule_overrides
CREATE INDEX IF NOT EXISTS idx_schedule_overrides_lookup ON public.schedule_overrides USING btree (doctor_id, clinic_id, override_date);

-- staff
CREATE INDEX IF NOT EXISTS idx_staff_auth_user_id ON public.staff USING btree (auth_user_id);

-- staff_clinics
CREATE INDEX IF NOT EXISTS idx_staff_clinics_clinic ON public.staff_clinics USING btree (clinic_id);
CREATE INDEX IF NOT EXISTS idx_staff_clinics_staff ON public.staff_clinics USING btree (staff_id);

-- waitlist
CREATE INDEX IF NOT EXISTS idx_waitlist_clinic ON public.waitlist USING btree (clinic_id, status);


-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

-- 7.1 get_user_clinic_ids() — returns UUID[] of user's clinics (used in all RLS policies)
CREATE OR REPLACE FUNCTION public.get_user_clinic_ids()
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    array_agg(sc.clinic_id),
    '{}'::UUID[]
  )
  FROM staff s
  JOIN staff_clinics sc ON sc.staff_id = s.id AND sc.is_active = true
  WHERE s.auth_user_id = auth.uid()
  AND s.is_active = true;
$function$;

-- 7.2 get_user_role(clinic_id) — returns role at specific clinic
CREATE OR REPLACE FUNCTION public.get_user_role(p_clinic_id uuid)
 RETURNS staff_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT sc.role
  FROM staff s
  JOIN staff_clinics sc ON sc.staff_id = s.id
  WHERE s.auth_user_id = auth.uid()
  AND sc.clinic_id = p_clinic_id
  AND s.is_active = true
  AND sc.is_active = true;
$function$;

-- 7.3 get_available_slots() — returns time slots with availability for a doctor on a date
CREATE OR REPLACE FUNCTION public.get_available_slots(p_doctor_id uuid, p_date date, p_clinic_id uuid)
 RETURNS TABLE(slot_start time without time zone, slot_end time without time zone, is_available boolean, existing_appointment_id uuid)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_day_of_week INTEGER;
  v_slot_duration INTEGER;
BEGIN
  -- Get day of week (0=Sunday, same as our doctor_schedules)
  v_day_of_week := EXTRACT(DOW FROM p_date)::INTEGER;

  -- Get slot duration from doctor_clinic_settings
  SELECT dcs.default_slot_duration_minutes INTO v_slot_duration
  FROM doctor_clinic_settings dcs
  WHERE dcs.doctor_id = p_doctor_id AND dcs.clinic_id = p_clinic_id;

  IF v_slot_duration IS NULL THEN
    v_slot_duration := 30;  -- fallback
  END IF;

  RETURN QUERY
  WITH schedule_blocks AS (
    -- Get the doctor's schedule for this day of the week
    SELECT ds.start_time AS block_start, ds.end_time AS block_end,
           COALESCE(ds.slot_duration_minutes, v_slot_duration) AS slot_dur
    FROM doctor_schedules ds
    WHERE ds.doctor_id = p_doctor_id
      AND ds.clinic_id = p_clinic_id
      AND ds.day_of_week = v_day_of_week
      AND ds.is_active = true
      AND ds.valid_from <= p_date
      AND (ds.valid_until IS NULL OR ds.valid_until >= p_date)
  ),
  generated_slots AS (
    -- Generate individual time slots from schedule blocks
    SELECT
      s.slot::TIME AS slot_start,
      (s.slot + (sb.slot_dur || ' minutes')::INTERVAL)::TIME AS slot_end
    FROM schedule_blocks sb,
    LATERAL generate_series(
      p_date + sb.block_start,
      p_date + sb.block_end - (sb.slot_dur || ' minutes')::INTERVAL,
      (sb.slot_dur || ' minutes')::INTERVAL
    ) AS s(slot)
  ),
  blocked_slots AS (
    -- Find overrides that block time on this date
    SELECT so.start_time AS block_start, so.end_time AS block_end
    FROM schedule_overrides so
    WHERE so.doctor_id = p_doctor_id
      AND so.clinic_id = p_clinic_id
      AND so.override_date = p_date
      AND so.override_type = 'block'
  ),
  booked_slots AS (
    -- Find existing appointments (not cancelled)
    SELECT a.start_time, a.end_time, a.id AS appointment_id
    FROM appointments a
    WHERE a.doctor_id = p_doctor_id
      AND a.clinic_id = p_clinic_id
      AND a.appointment_date = p_date
      AND a.status NOT IN ('cancelled_patient', 'cancelled_doctor', 'rescheduled')
  )
  SELECT
    gs.slot_start,
    gs.slot_end,
    -- A slot is available if it's not blocked and not booked
    NOT EXISTS (
      SELECT 1 FROM blocked_slots bs
      WHERE (bs.block_start IS NULL)  -- full day block
         OR (gs.slot_start >= bs.block_start AND gs.slot_start < bs.block_end)
    )
    AND NOT EXISTS (
      SELECT 1 FROM booked_slots bk
      WHERE gs.slot_start < bk.end_time AND gs.slot_end > bk.start_time
    ) AS is_available,
    -- Return the appointment ID if this slot is booked
    (SELECT bk.appointment_id FROM booked_slots bk
     WHERE gs.slot_start < bk.end_time AND gs.slot_end > bk.start_time
     LIMIT 1) AS existing_appointment_id
  FROM generated_slots gs
  ORDER BY gs.slot_start;
END;
$function$;

-- 7.4 check_appointment_overlap() — trigger preventing double-booking
CREATE OR REPLACE FUNCTION public.check_appointment_overlap()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Skip check for overbooking appointments
  IF NEW.is_overbooking = true THEN
    RETURN NEW;
  END IF;

  -- Skip check for cancelled/rescheduled appointments
  IF NEW.status IN ('cancelled_patient', 'cancelled_doctor', 'rescheduled') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE doctor_id = NEW.doctor_id
      AND clinic_id = NEW.clinic_id
      AND appointment_date = NEW.appointment_date
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000')
      AND status NOT IN ('cancelled_patient', 'cancelled_doctor', 'rescheduled')
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Appointment overlaps with an existing appointment for this doctor';
  END IF;

  RETURN NEW;
END;
$function$;

-- 7.5 check_payment_update() — trigger restricting payment changes to admin/secretary
CREATE OR REPLACE FUNCTION public.check_payment_update()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_role staff_role;
BEGIN
  -- Only check if payment_status actually changed
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    v_role := get_user_role(NEW.clinic_id);

    IF v_role IS NULL OR v_role = 'doctor' THEN
      RAISE EXCEPTION 'Only admin or secretary can update payment status';
    END IF;

    -- Track who changed it
    NEW.payment_updated_by := (
      SELECT s.id FROM staff s WHERE s.auth_user_id = auth.uid()
    );
    NEW.payment_updated_at := now();
  END IF;

  RETURN NEW;
END;
$function$;

-- 7.6 update_no_show_count() — trigger auto-incrementing clinic_patients.no_show_count
CREATE OR REPLACE FUNCTION public.update_no_show_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.status = 'no_show' AND (OLD.status IS NULL OR OLD.status != 'no_show') THEN
    UPDATE clinic_patients
    SET no_show_count = no_show_count + 1, updated_at = now()
    WHERE id = NEW.patient_id;
  END IF;

  IF OLD.status = 'no_show' AND NEW.status != 'no_show' THEN
    UPDATE clinic_patients
    SET no_show_count = GREATEST(no_show_count - 1, 0), updated_at = now()
    WHERE id = NEW.patient_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- 7.7 update_updated_at() — generic trigger to auto-set updated_at on UPDATE
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 7.8 match_clinic_documents() — pgvector similarity search filtered by clinic_id
CREATE OR REPLACE FUNCTION public.match_clinic_documents(
  query_embedding vector,
  match_clinic_id uuid,
  match_count integer DEFAULT 5,
  filter_source_types text[] DEFAULT NULL::text[]
)
 RETURNS TABLE(id uuid, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.content,
    de.metadata,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  WHERE de.clinic_id = match_clinic_id
    AND (filter_source_types IS NULL
         OR de.source_type = ANY(filter_source_types))
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- 7.9 log_patient_change() — audit trigger for clinic_patients changes
CREATE OR REPLACE FUNCTION public.log_patient_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_action TEXT;
  v_old JSONB;
  v_new JSONB;
  v_changed TEXT[];
  v_key TEXT;
  v_staff_id UUID;
  v_staff_role TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_changed := ARRAY[]::TEXT[];
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_changed := ARRAY[]::TEXT[];
    FOR v_key IN SELECT jsonb_object_keys(v_new)
    LOOP
      IF v_old ->> v_key IS DISTINCT FROM v_new ->> v_key THEN
        v_changed := v_changed || v_key;
      END IF;
    END LOOP;
    IF array_length(v_changed, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_changed := ARRAY[]::TEXT[];
  END IF;

  BEGIN
    SELECT s.id INTO v_staff_id
    FROM staff s
    WHERE s.auth_user_id = auth.uid();

    IF v_staff_id IS NOT NULL THEN
      SELECT sc.role::TEXT INTO v_staff_role
      FROM staff_clinics sc
      WHERE sc.staff_id = v_staff_id
        AND sc.clinic_id = COALESCE(NEW.clinic_id, OLD.clinic_id)
      LIMIT 1;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_staff_id := NULL;
    v_staff_role := NULL;
  END;

  INSERT INTO patient_history (
    patient_id, clinic_id, action, old_values, new_values,
    changed_fields, performed_by, performed_by_role
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.clinic_id, OLD.clinic_id),
    v_action, v_old, v_new, v_changed, v_staff_id, v_staff_role
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;


-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- appointments triggers
CREATE TRIGGER trg_check_appointment_overlap
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.check_appointment_overlap();

CREATE TRIGGER trg_check_appointment_overlap
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.check_appointment_overlap();

CREATE TRIGGER trg_check_payment_update
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.check_payment_update();

CREATE TRIGGER trg_update_no_show_count
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_no_show_count();

CREATE TRIGGER trg_updated_at_appointments
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- clinic_patients triggers
CREATE TRIGGER trg_log_patient_change
  AFTER INSERT ON public.clinic_patients
  FOR EACH ROW EXECUTE FUNCTION public.log_patient_change();

CREATE TRIGGER trg_log_patient_change
  AFTER UPDATE ON public.clinic_patients
  FOR EACH ROW EXECUTE FUNCTION public.log_patient_change();

CREATE TRIGGER trg_log_patient_change
  AFTER DELETE ON public.clinic_patients
  FOR EACH ROW EXECUTE FUNCTION public.log_patient_change();

CREATE TRIGGER trg_updated_at_clinic_patients
  BEFORE UPDATE ON public.clinic_patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- clinics triggers
CREATE TRIGGER trg_updated_at_clinics
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- doctor_clinic_settings triggers
CREATE TRIGGER trg_updated_at_doctor_clinic_settings
  BEFORE UPDATE ON public.doctor_clinic_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- doctor_schedules triggers
CREATE TRIGGER trg_updated_at_doctor_schedules
  BEFORE UPDATE ON public.doctor_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- doctors triggers
CREATE TRIGGER trg_updated_at_doctors
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- reminders triggers
CREATE TRIGGER trg_updated_at_reminders
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- schedule_overrides triggers
CREATE TRIGGER trg_updated_at_schedule_overrides
  BEFORE UPDATE ON public.schedule_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- staff triggers
CREATE TRIGGER trg_updated_at_staff
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- waitlist triggers
CREATE TRIGGER trg_updated_at_waitlist
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.appointment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- ---- appointment_history ----
CREATE POLICY "System can insert history"
  ON public.appointment_history FOR INSERT
  TO public
  WITH CHECK (clinic_id = ANY (get_user_clinic_ids()));

CREATE POLICY "Users can view history at own clinics"
  ON public.appointment_history FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

-- ---- appointments ----
CREATE POLICY "Staff can create appointments"
  ON public.appointments FOR INSERT
  TO public
  WITH CHECK (clinic_id = ANY (get_user_clinic_ids()));

CREATE POLICY "Staff can update appointments at own clinics"
  ON public.appointments FOR UPDATE
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

CREATE POLICY "Users can view appointments at own clinics"
  ON public.appointments FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

-- ---- clinic_faqs ----
CREATE POLICY "Admin can delete own clinic FAQs"
  ON public.clinic_faqs FOR DELETE
  TO public
  USING ((clinic_id = ANY (get_user_clinic_ids())) AND (get_user_role(clinic_id) = 'admin'::staff_role));

CREATE POLICY "Admin can manage own clinic FAQs"
  ON public.clinic_faqs FOR INSERT
  TO public
  WITH CHECK ((clinic_id = ANY (get_user_clinic_ids())) AND (get_user_role(clinic_id) = 'admin'::staff_role));

CREATE POLICY "Admin can update own clinic FAQs"
  ON public.clinic_faqs FOR UPDATE
  TO public
  USING ((clinic_id = ANY (get_user_clinic_ids())) AND (get_user_role(clinic_id) = 'admin'::staff_role));

CREATE POLICY "Staff can view own clinic FAQs"
  ON public.clinic_faqs FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

-- ---- clinic_patients ----
CREATE POLICY "Admin can delete clinic_patients"
  ON public.clinic_patients FOR DELETE
  TO public
  USING (get_user_role(clinic_id) = 'admin'::staff_role);

CREATE POLICY "Admin/secretary can insert clinic_patients"
  ON public.clinic_patients FOR INSERT
  TO public
  WITH CHECK (get_user_role(clinic_id) = ANY (ARRAY['admin'::staff_role, 'secretary'::staff_role]));

CREATE POLICY "Admin/secretary can update clinic_patients"
  ON public.clinic_patients FOR UPDATE
  TO public
  USING (get_user_role(clinic_id) = ANY (ARRAY['admin'::staff_role, 'secretary'::staff_role]));

CREATE POLICY "Users can view clinic_patients at own clinics"
  ON public.clinic_patients FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

-- ---- clinic_services ----
CREATE POLICY "Admin can delete own clinic services"
  ON public.clinic_services FOR DELETE
  TO public
  USING ((clinic_id = ANY (get_user_clinic_ids())) AND (get_user_role(clinic_id) = 'admin'::staff_role));

CREATE POLICY "Admin can manage own clinic services"
  ON public.clinic_services FOR INSERT
  TO public
  WITH CHECK ((clinic_id = ANY (get_user_clinic_ids())) AND (get_user_role(clinic_id) = 'admin'::staff_role));

CREATE POLICY "Admin can update own clinic services"
  ON public.clinic_services FOR UPDATE
  TO public
  USING ((clinic_id = ANY (get_user_clinic_ids())) AND (get_user_role(clinic_id) = 'admin'::staff_role));

CREATE POLICY "Staff can view own clinic services"
  ON public.clinic_services FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

-- ---- clinics ----
CREATE POLICY "Admins can update own clinic"
  ON public.clinics FOR UPDATE
  TO public
  USING (get_user_role(id) = 'admin'::staff_role);

CREATE POLICY "Users can view own clinics"
  ON public.clinics FOR SELECT
  TO public
  USING (id = ANY (get_user_clinic_ids()));

-- ---- conversation_sessions ----
CREATE POLICY "Service role only"
  ON public.conversation_sessions FOR ALL
  TO public
  USING (false);

-- ---- doctor_clinic_settings ----
CREATE POLICY "Admins can manage doctor settings"
  ON public.doctor_clinic_settings FOR ALL
  TO public
  USING (get_user_role(clinic_id) = 'admin'::staff_role);

CREATE POLICY "Users can view doctor settings at own clinics"
  ON public.doctor_clinic_settings FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

-- ---- doctor_schedules ----
CREATE POLICY "Admins and own doctor can manage schedules"
  ON public.doctor_schedules FOR ALL
  TO public
  USING (
    (get_user_role(clinic_id) = 'admin'::staff_role)
    OR (
      (get_user_role(clinic_id) = 'doctor'::staff_role)
      AND (doctor_id = (
        SELECT d.id
        FROM doctors d
        JOIN staff s ON s.id = d.staff_id
        WHERE s.auth_user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can view schedules at own clinics"
  ON public.doctor_schedules FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

-- ---- doctors ----
CREATE POLICY "Users can view doctors at own clinics"
  ON public.doctors FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1
    FROM doctor_clinic_settings dcs
    WHERE dcs.doctor_id = doctors.id
      AND dcs.clinic_id = ANY (get_user_clinic_ids())
  ));

-- ---- document_embeddings ----
CREATE POLICY "Service role only"
  ON public.document_embeddings FOR ALL
  TO public
  USING (false);

-- ---- patient_history ----
CREATE POLICY "Staff can view audit logs for their clinics"
  ON public.patient_history FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

CREATE POLICY "System can insert audit logs"
  ON public.patient_history FOR INSERT
  TO public
  WITH CHECK (true);

-- ---- reminders ----
CREATE POLICY "System can manage reminders"
  ON public.reminders FOR ALL
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

CREATE POLICY "Users can view reminders at own clinics"
  ON public.reminders FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

-- ---- schedule_overrides ----
CREATE POLICY "Admins and own doctor can manage overrides"
  ON public.schedule_overrides FOR ALL
  TO public
  USING (
    (get_user_role(clinic_id) = 'admin'::staff_role)
    OR (
      (get_user_role(clinic_id) = 'doctor'::staff_role)
      AND (doctor_id = (
        SELECT d.id
        FROM doctors d
        JOIN staff s ON s.id = d.staff_id
        WHERE s.auth_user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can view overrides at own clinics"
  ON public.schedule_overrides FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

-- ---- staff ----
CREATE POLICY "Users can view staff at own clinics"
  ON public.staff FOR SELECT
  TO public
  USING (
    (auth_user_id = auth.uid())
    OR (EXISTS (
      SELECT 1
      FROM staff_clinics sc
      WHERE sc.staff_id = staff.id
        AND sc.clinic_id = ANY (get_user_clinic_ids())
    ))
  );

-- ---- staff_clinics ----
CREATE POLICY "Admins can manage staff_clinics"
  ON public.staff_clinics FOR ALL
  TO public
  USING (get_user_role(clinic_id) = 'admin'::staff_role);

CREATE POLICY "Users can view staff at own clinics"
  ON public.staff_clinics FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));

-- ---- waitlist ----
CREATE POLICY "Admin/secretary can manage waitlist"
  ON public.waitlist FOR ALL
  TO public
  USING (get_user_role(clinic_id) = ANY (ARRAY['admin'::staff_role, 'secretary'::staff_role]));

CREATE POLICY "Users can view waitlist at own clinics"
  ON public.waitlist FOR SELECT
  TO public
  USING (clinic_id = ANY (get_user_clinic_ids()));


-- ============================================================================
-- 10. REALTIME
-- ============================================================================

-- Enable Supabase Realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;


-- ============================================================================
-- END OF BASELINE MIGRATION
-- ============================================================================
