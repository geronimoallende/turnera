# Database Schema

## Table Inventory (13 tables)

| # | Table | Type | Description |
|---|-------|------|-------------|
| 1 | `clinics` | Tenant | Clinic configuration, business hours, cancellation policy |
| 2 | `staff` | Global | Staff identity (auth link, name, email) |
| 3 | `staff_clinics` | Junction | Staff ↔ Clinic + role (admin/doctor/secretary) |
| 4 | `doctors` | Global | Doctor profile (specialty, license, virtual settings) |
| 5 | `doctor_clinic_settings` | Junction | Per-clinic doctor config (fee, slot duration, overbooking) |
| 6 | `patients` | Global | Patient identity (DNI, name, phone, basic medical) |
| 7 | `clinic_patients` | Junction | Per-clinic patient metadata (blacklist, insurance, CRM, tags) |
| 8 | `doctor_schedules` | Per-clinic | Weekly recurring availability templates |
| 9 | `schedule_overrides` | Per-clinic | One-off exceptions (vacations, sick days) |
| 10 | `appointments` | Per-clinic | Core table — the heart of the system |
| 11 | `waitlist` | Per-clinic | Patients waiting for openings |
| 12 | `appointment_history` | Per-clinic | Immutable audit log of all changes |
| 13 | `reminders` | Per-clinic | Outbound communication tracking |

## Entity Relationship

```
clinics ──┬── staff_clinics ──── staff
           │                       │
           ├── doctor_clinic_settings ── doctors (extends staff)
           │
           ├── clinic_patients ──── patients
           │
           ├── doctor_schedules
           ├── schedule_overrides
           │
           ├── appointments ──┬── appointment_history
           │                  └── reminders
           └── waitlist
```

## Detailed schemas

See `docs/plan.md` sections "Table Details" for complete column definitions.

## Key Constraints

- `patients.dni` is UNIQUE globally
- `staff_clinics` has UNIQUE(staff_id, clinic_id) — one role per clinic
- `clinic_patients` has UNIQUE(clinic_id, patient_id) — one record per patient per clinic
- `doctor_clinic_settings` has UNIQUE(doctor_id, clinic_id)
- `appointments` overlap check via trigger (unless `is_overbooking = true`)
- `payment_status` writable only by admin/secretary (enforced by trigger)

## Functions

| Function | Type | Purpose |
|----------|------|---------|
| `get_user_clinic_ids()` | Helper | Returns UUID[] of user's clinics |
| `get_user_role(clinic_id)` | Helper | Returns role at specific clinic |
| `get_available_slots(doctor_id, date, clinic_id)` | Query | Returns time slots with availability |
| `check_appointment_overlap()` | Trigger | Prevents double-booking |
| `check_payment_update()` | Trigger | Restricts payment changes to admin/secretary |
| `update_no_show_count()` | Trigger | Auto-increments clinic_patients.no_show_count |

## RLS Pattern

All policies use: `clinic_id = ANY(get_user_clinic_ids())`

Write restrictions by role via: `get_user_role(clinic_id) IN ('admin', 'secretary')`
