-- Migration 017: Create patient_history audit table
--
-- WHY: Argentine Ley 26.529 (Patient Rights) mandates an immutable audit trail
-- for all modifications to patient data. Every create, update, and delete on
-- clinic_patients must be logged with: who did it, when, what changed.
--
-- This table is INSERT-ONLY. No UPDATE or DELETE policies exist.
-- Records must be retained for 10 years (legal requirement).

-- ─── Table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patient_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which patient was modified
  patient_id UUID NOT NULL REFERENCES clinic_patients(id) ON DELETE CASCADE,

  -- Denormalized for RLS performance (avoids joining clinic_patients on every read)
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- What happened: 'created', 'updated', 'deleted'
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),

  -- Full snapshot of the record before and after the change
  old_values JSONB,        -- null on 'created'
  new_values JSONB,        -- null on 'deleted'

  -- Which specific fields changed (quick scan without diffing JSONB)
  changed_fields TEXT[],

  -- Who made the change (staff member)
  performed_by UUID REFERENCES staff(id),

  -- Their role at the time of the change
  performed_by_role TEXT,

  -- IP address for security audits
  ip_address TEXT,

  -- When the change happened
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ────────────────────────────────────────────────────────

CREATE INDEX idx_patient_history_patient_id ON patient_history(patient_id);
CREATE INDEX idx_patient_history_clinic_id ON patient_history(clinic_id);
CREATE INDEX idx_patient_history_created_at ON patient_history(created_at);

-- ─── RLS ────────────────────────────────────────────────────────────
-- Same pattern as all other per-clinic tables.
-- SELECT only — no UPDATE or DELETE allowed (immutable audit log).

ALTER TABLE patient_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view audit logs for their clinics"
  ON patient_history
  FOR SELECT
  USING (clinic_id = ANY(get_user_clinic_ids()));

-- INSERT policy for the trigger (runs as SECURITY DEFINER)
CREATE POLICY "System can insert audit logs"
  ON patient_history
  FOR INSERT
  WITH CHECK (clinic_id = ANY(get_user_clinic_ids()));

-- ─── Trigger Function ──────────────────────────────────────────────
-- Automatically logs every INSERT, UPDATE, DELETE on clinic_patients.

CREATE OR REPLACE FUNCTION log_patient_change()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_old JSONB;
  v_new JSONB;
  v_changed TEXT[];
  v_key TEXT;
  v_staff_id UUID;
  v_staff_role TEXT;
BEGIN
  -- Determine the action
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_changed := ARRAY[]::TEXT[];
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'updated';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    -- Calculate which fields actually changed
    v_changed := ARRAY[]::TEXT[];
    FOR v_key IN SELECT jsonb_object_keys(v_new)
    LOOP
      IF v_old ->> v_key IS DISTINCT FROM v_new ->> v_key THEN
        v_changed := v_changed || v_key;
      END IF;
    END LOOP;
    -- Skip if nothing actually changed (e.g., UPDATE with same values)
    IF array_length(v_changed, 1) IS NULL THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_changed := ARRAY[]::TEXT[];
  END IF;

  -- Try to get the current staff member (may be NULL for service_role operations)
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
    -- auth.uid() may fail in service_role context — that's fine
    v_staff_id := NULL;
    v_staff_role := NULL;
  END;

  -- Insert the audit record
  INSERT INTO patient_history (
    patient_id,
    clinic_id,
    action,
    old_values,
    new_values,
    changed_fields,
    performed_by,
    performed_by_role
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.clinic_id, OLD.clinic_id),
    v_action,
    v_old,
    v_new,
    v_changed,
    v_staff_id,
    v_staff_role
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Attach Trigger ─────────────────────────────────────────────────

CREATE TRIGGER trg_log_patient_change
  AFTER INSERT OR UPDATE OR DELETE ON clinic_patients
  FOR EACH ROW
  EXECUTE FUNCTION log_patient_change();
