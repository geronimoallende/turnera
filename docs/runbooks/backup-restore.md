# Backup & Restore

## Supabase Automatic Backups
- Supabase Pro plan includes daily automatic backups
- Retention: 7 days
- Access via Supabase Dashboard → Database → Backups

## Manual Backup

```bash
# Export database via pg_dump (requires connection string from Supabase dashboard)
pg_dump "postgresql://postgres:[PASSWORD]@db.nzozdrakzqhvvmdgkqjh.supabase.co:5432/postgres" \
  --no-owner --no-acl \
  -t clinics -t staff -t staff_clinics -t doctors -t doctor_clinic_settings \
  -t patients -t clinic_patients -t doctor_schedules -t schedule_overrides \
  -t appointments -t waitlist -t appointment_history -t reminders \
  > backup_$(date +%Y%m%d).sql
```

## Restore

```bash
# Restore from backup file
psql "postgresql://postgres:[PASSWORD]@db.nzozdrakzqhvvmdgkqjh.supabase.co:5432/postgres" \
  < backup_20260311.sql
```

## Important
- Never share connection strings or passwords in code
- Store backup files securely
- Test restores periodically in a dev environment
