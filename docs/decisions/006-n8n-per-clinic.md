# ADR-006: One n8n Workflow Per Clinic

## Status
Accepted

## Context
n8n handles the WhatsApp chatbot and reminder system. Should workflows be shared across all clinics or isolated per clinic?

## Decision
Each clinic gets its own copy of each workflow (CB-6 Appointment Manager, CB-7 Reminder Dispatcher).

## Alternatives Considered
- **Shared workflows (clinic_id as parameter)**: Less duplication but a bug breaks all clinics. Hard to customize per clinic. One WhatsApp number for all.
- **Hybrid (shared logic, per-clinic triggers)**: Sub-workflows for shared logic, thin triggers per clinic. More complex architecture.
- **Per-clinic (chosen)**: Each clinic has independent workflows.

## Consequences
- Per-clinic WhatsApp numbers (each clinic has their own)
- Isolated failures — if Clinic A's workflow breaks, Clinic B keeps working
- Per-clinic customization (different reminder timing, different messages)
- More workflows to maintain — updates must be replicated across clinics
- `clinics.n8n_webhook_url` stores the per-clinic n8n endpoint
- `clinics.whatsapp_number` stores the per-clinic WhatsApp number
