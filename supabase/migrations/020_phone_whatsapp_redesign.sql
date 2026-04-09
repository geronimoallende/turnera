-- Migration 020: Phone/WhatsApp redesign
--
-- Problem: whatsapp_phone column duplicates phone 99% of the time.
-- In Argentina, the phone number IS the WhatsApp number almost always.
--
-- Solution: Drop whatsapp_phone, add whatsapp_enabled boolean (default true).
-- Backend logic (Phase 2): if whatsapp_enabled AND phone → send WhatsApp.

-- ── clinic_patients ─────────────────────────────────────────────────

-- Add the boolean flag (default true = phone has WhatsApp)
ALTER TABLE clinic_patients
  ADD COLUMN whatsapp_enabled BOOLEAN NOT NULL DEFAULT true;

-- Drop the redundant column
ALTER TABLE clinic_patients
  DROP COLUMN whatsapp_phone;

-- ── staff ───────────────────────────────────────────────────────────
-- Staff (doctors) also need WhatsApp support for Phase 2 notifications.

ALTER TABLE staff
  ADD COLUMN whatsapp_enabled BOOLEAN NOT NULL DEFAULT true;
