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

## Reminders

| Method | Route | Description | Roles |
|--------|-------|-------------|-------|
| POST | `/api/reminders/send` | Trigger reminder batch | System/n8n |

## Chatbot (requires `x-webhook-secret` header)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/chatbot/available-slots` | Slots for doctor+date |
| POST | `/api/chatbot/book` | Book appointment |
| POST | `/api/chatbot/cancel` | Cancel appointment |
| GET | `/api/chatbot/patient-appointments` | Upcoming for phone |
| GET | `/api/chatbot/doctors` | List doctors |
| POST | `/api/chatbot/confirm` | Patient confirms |
