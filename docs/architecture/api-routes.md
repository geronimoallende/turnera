# API Routes

All routes require authentication via Supabase Auth unless noted otherwise.
All routes filter by the active `clinic_id` from the request.

## Appointments

| Method | Route | Description | Roles |
|--------|-------|-------------|-------|
| GET | `/api/appointments` | List appointments (filterable by date, doctor, status) | All |
| POST | `/api/appointments` | Create appointment | Admin, Secretary, Doctor (own) |
| GET | `/api/appointments/[id]` | Get appointment detail | All |
| PATCH | `/api/appointments/[id]` | Update appointment | Admin, Secretary, Doctor (own) |
| DELETE | `/api/appointments/[id]` | Cancel appointment | Admin, Secretary |
| GET | `/api/appointments/available-slots` | Get available slots for doctor+date | All |
| POST | `/api/appointments/bulk-cancel` | Cancel multiple appointments | Admin |

## Patients

| Method | Route | Description | Roles |
|--------|-------|-------------|-------|
| GET | `/api/patients` | List patients for current clinic | All |
| POST | `/api/patients` | Create patient (upsert by DNI + link to clinic) | Admin, Secretary |
| GET | `/api/patients/[id]` | Patient detail with clinic-specific metadata | All |
| PATCH | `/api/patients/[id]` | Update patient | Admin, Secretary |
| GET | `/api/patients/search` | Search by name, DNI, phone | All |

## Doctors

| Method | Route | Description | Roles |
|--------|-------|-------------|-------|
| GET | `/api/doctors` | List doctors at clinic | All |
| GET | `/api/doctors/[id]` | Doctor profile + clinic settings | All |
| PUT | `/api/doctors/[id]` | Update doctor profile | Admin, Doctor (own) |
| PUT | `/api/doctors/[id]/settings` | Update per-clinic settings | Admin |
| GET | `/api/doctors/[id]/schedules` | List weekly schedules | All |
| POST | `/api/doctors/[id]/schedules` | Add schedule block | Admin, Doctor (own) |
| DELETE | `/api/doctors/[id]/schedules/[scheduleId]` | Remove schedule | Admin, Doctor (own) |
| GET | `/api/doctors/[id]/overrides` | List schedule overrides | All |
| POST | `/api/doctors/[id]/overrides` | Add override | Admin, Doctor (own) |
| DELETE | `/api/doctors/[id]/overrides/[overrideId]` | Remove override | Admin, Doctor (own) |
| GET | `/api/doctors/[id]/available-slots` | Get slots for date | All |

## Waitlist

| Method | Route | Description | Roles |
|--------|-------|-------------|-------|
| GET | `/api/waitlist` | List waitlist entries | All |
| POST | `/api/waitlist` | Add to waitlist | Admin, Secretary |
| PATCH | `/api/waitlist/[id]` | Update entry (offer slot) | Admin, Secretary |

## Reports

| Method | Route | Description | Roles |
|--------|-------|-------------|-------|
| GET | `/api/reports/daily` | Today's summary (on-the-fly) | All |
| GET | `/api/reports/weekly` | Weekly stats | All |
| GET | `/api/reports/monthly` | Monthly stats | Admin, Secretary |
| GET | `/api/reports/export-pdf` | Export agenda as PDF | All |

## Note: WhatsApp & AI Endpoints

WhatsApp webhooks, chatbot, reminders, and RAG are handled by the **Python AI backend** (FastAPI on a separate VPS), not by Next.js API routes. The Python backend talks directly to Supabase with `service_role` key. See `docs/decisions/012-python-ai-backend.md`.
