# ADR-002: Multi-Tenancy via clinic_id Isolation

## Status
Accepted

## Context
The system is SaaS — multiple clinics share the same database. We need data isolation.

## Decision
Use `clinic_id` column on per-clinic tables + RLS policies filtering by `clinic_id = ANY(get_user_clinic_ids())`. Mirrors the existing `client_id` pattern from the chatbot SaaS.

## Alternatives Considered
- **Separate databases per clinic**: Maximum isolation but expensive and hard to manage at scale.
- **Schema-per-tenant**: PostgreSQL schemas. Good isolation but complex migrations.
- **Row-level isolation (chosen)**: Single schema, `clinic_id` on every row, RLS enforces isolation. Simplest, scales well.

## Consequences
- All data in one database, easy to query across clinics if needed (admin/superadmin)
- RLS must be correct — a policy bug could leak data
- Python AI backend uses `service_role` key and must always include `clinic_id` in queries
