-- Migration: Add UPDATE policies to staff and doctors tables
--
-- Problem: Both tables had RLS enabled with only SELECT policies.
-- The PUT /api/doctors/[id] route updates both tables, but the updates
-- were silently returning 0 rows because RLS blocked them.
--
-- Rules (matching checkDoctorPermission logic):
--   - Admin can update any staff/doctor at their clinics
--   - Doctor can update their own staff record

-- ---- staff: allow self-update and admin update ----
CREATE POLICY "Users can update own staff record"
  ON public.staff FOR UPDATE
  TO public
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Admins can update staff at own clinics"
  ON public.staff FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM staff_clinics sc
      WHERE sc.staff_id = staff.id
        AND sc.clinic_id = ANY (get_user_clinic_ids())
        AND get_user_role(sc.clinic_id) = 'admin'::staff_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM staff_clinics sc
      WHERE sc.staff_id = staff.id
        AND sc.clinic_id = ANY (get_user_clinic_ids())
        AND get_user_role(sc.clinic_id) = 'admin'::staff_role
    )
  );

-- ---- doctors: allow own update and admin update ----
CREATE POLICY "Doctors can update own record"
  ON public.doctors FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM staff s
      WHERE s.id = doctors.staff_id
        AND s.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM staff s
      WHERE s.id = doctors.staff_id
        AND s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update doctors at own clinics"
  ON public.doctors FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM doctor_clinic_settings dcs
      WHERE dcs.doctor_id = doctors.id
        AND dcs.clinic_id = ANY (get_user_clinic_ids())
        AND get_user_role(dcs.clinic_id) = 'admin'::staff_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM doctor_clinic_settings dcs
      WHERE dcs.doctor_id = doctors.id
        AND dcs.clinic_id = ANY (get_user_clinic_ids())
        AND get_user_role(dcs.clinic_id) = 'admin'::staff_role
    )
  );
