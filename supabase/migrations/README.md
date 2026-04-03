# Database Migrations

## Baseline (20 migrations applied before git tracking)

The following migrations were applied directly to production before we started
tracking migrations in git. They are recorded in Supabase's migration history
but the SQL files were not saved locally.

To recreate the schema from scratch, run `supabase db pull --schema public`
against the production project (requires `supabase login` first).

### Applied migrations (in order):

1. `20260327184615_001_create_enums` — Custom enum types (staff_role, appointment_status, etc.)
2. `20260327184627_002_create_clinics` — Clinics table (tenant config)
3. `20260327184636_003_create_staff` — Staff + staff_clinics tables
4. `20260327184645_004_create_doctors` — Doctors + doctor_clinic_settings tables
5. `20260327184700_005_create_patients` — clinic_patients table (per-clinic, no global)
6. `20260327184711_006_create_schedules` — doctor_schedules + schedule_overrides
7. `20260327184723_007_create_appointments` — Appointments table (core)
8. `20260327184730_008_create_waitlist` — Waitlist table
9. `20260327184739_009_create_history` — appointment_history (immutable audit log)
10. `20260327184747_010_create_reminders` — Reminders (outbound communications)
11. `20260327184810_011_create_functions` — get_user_clinic_ids, get_user_role, get_available_slots
12. `20260327184831_012_create_triggers` — overlap check, payment check, no-show counter
13. `20260327184853_013_create_rls_policies` — RLS policies for all tables
14. `20260327184859_014_enable_realtime` — Supabase Realtime on appointments + waitlist
15. `20260327184909_015_create_indexes` — Performance indexes
16. `20260329193348_016_merge_patients_into_clinic_patients` — Eliminated global patients table
17. `20260329230723_016_add_booking_window` — max_booking_days_ahead, min_booking_hours_ahead on clinics
18. `20260330041806_fix_staff_rls_policy_view_clinic_staff` — Fix staff RLS for multi-clinic
19. `20260330042924_fix_get_available_slots_time_cast` — Fix time casting in slot calculation
20. `20260331222421_python_ai_backend` — clinic_faqs, clinic_services, document_embeddings, conversation_sessions + WhatsApp columns

### Tables (16 total):

clinics, staff, staff_clinics, doctors, doctor_clinic_settings,
clinic_patients, doctor_schedules, schedule_overrides, appointments,
waitlist, appointment_history, reminders, clinic_faqs, clinic_services,
document_embeddings, conversation_sessions

### How to add new migrations:

All NEW migrations go in this folder with sequential numbering:
```
017_create_patient_history.sql
018_add_entreturno_rendicion.sql
```

Apply to production: use the Supabase MCP `apply_migration` tool or:
```bash
npx supabase db push --project-ref lavfzixecvbvdqxyiwwl
```

When we set up CI/CD (Week 6), migrations will run automatically via GitHub Actions.
