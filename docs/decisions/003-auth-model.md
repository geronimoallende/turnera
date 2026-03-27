# ADR-003: Staff-Only Authentication

## Status
Accepted

## Context
Who needs to log in to the system?

## Decision
Only staff members (admin, doctor, secretary) have accounts and can log in. Patients do NOT have accounts — they interact only via WhatsApp chatbot or phone calls.

## Alternatives Considered
- **Patient portal**: Patients create accounts, book appointments online. Adds complexity (patient auth, self-service UI, email verification). Deferred to Phase 4.
- **Staff + patient auth (chosen against)**: Too much scope for MVP.

## Consequences
- Simpler auth flow — only 3 roles to manage
- Patients are managed as CRM records, not as users
- Chatbot identifies patients by phone number / DNI, not by login
- Patient self-service portal can be added later without changing the core system
