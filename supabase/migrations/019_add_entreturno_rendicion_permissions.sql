-- Migration 019: Add entreturno, rendicion, and doctor permission columns
-- Also adds otorgado and cancelled_clinic to appointment_status enum

-- 1. Add new status values to enum
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'otorgado';
ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'cancelled_clinic';

-- 2. Add entreturno and rendicion columns to appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_entreturno BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS coseguro_amount NUMERIC(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS order_number TEXT;

-- 3. Add doctor permission columns to doctor_clinic_settings
ALTER TABLE doctor_clinic_settings ADD COLUMN IF NOT EXISTS can_create_appointments BOOLEAN DEFAULT false;
ALTER TABLE doctor_clinic_settings ADD COLUMN IF NOT EXISTS can_cancel_appointments BOOLEAN DEFAULT false;
