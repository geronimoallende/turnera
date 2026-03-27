# System Design (Backend)

## Authentication Flow

1. Staff navigates to `/login`
2. Submits email + password → Supabase Auth
3. Supabase returns JWT containing `auth.uid()`
4. Middleware checks JWT → redirects unauthenticated users to `/login`
5. `ClinicProvider` calls `get_user_clinic_ids()` to determine available clinics
6. If multi-clinic: shows clinic switcher. If single: auto-selects.
7. All subsequent queries include `.eq('clinic_id', activeClinicId)`
8. RLS validates `clinic_id = ANY(get_user_clinic_ids())` on every query

## Appointment Lifecycle

```
scheduled → confirmed → arrived → in_progress → completed
    │           │
    ├→ cancelled_patient
    ├→ cancelled_doctor
    ├→ rescheduled
    └→ no_show (triggers no_show_count increment)
```

## Patient Creation Flow (Upsert by DNI)

1. Secretary enters patient data including DNI
2. API checks: does a patient with this DNI exist in `patients`?
   - **Yes**: Use existing patient record
   - **No**: INSERT into `patients`
3. Check: is this patient linked to the current clinic in `clinic_patients`?
   - **Yes**: Update metadata if needed
   - **No**: INSERT into `clinic_patients` with default metadata
4. Return the patient with clinic-specific metadata

## Reminder System (n8n)

Per-clinic CB-7 workflow runs on schedule:
1. Query appointments WHERE `reminder_24h_sent_at IS NULL` AND date = tomorrow
2. For each: send WhatsApp via clinic's WhatsApp number
3. Update `reminder_24h_sent_at` timestamp
4. Parse patient responses (confirm/cancel/reschedule)
5. Update appointment status accordingly

## Reports (On-the-Fly)

No cache table. Simple aggregates over `appointments`:
- Attendance rate: `COUNT(*) FILTER (WHERE status IN ('completed','arrived')) / COUNT(*)`
- No-show rate: `COUNT(*) FILTER (WHERE status = 'no_show') / COUNT(*)`
- Revenue projection: `SUM(consultation_fee)` from `doctor_clinic_settings`
- Insurance distribution: `GROUP BY insurance_provider` from `clinic_patients`

## Deployment

GitHub commits → Vercel auto-deploy (connected to repo).
Database migrations run via Supabase CLI: `supabase db push`
