# ADR-011: Clinic-Owned Patients (Remove Global patients Table)

## Status
Accepted

## Context
The original design (ADR-005) had a global `patients` table with DNI as a globally unique key, plus a `clinic_patients` junction table for per-clinic metadata. This caused several issues:

1. **Cross-clinic data mutation**: If one clinic edited a patient's phone number or address, the change affected all clinics that shared that patient record. No clinic "owned" the core data.
2. **DNI collision edge cases**: Enforcing globally unique DNI created friction when two clinics independently registered the same person with slightly different data.
3. **Unnecessary complexity**: Every patient query required a JOIN between `patients` and `clinic_patients`. The upsert logic on creation (check DNI, create if not exists, then link) added code complexity for a cross-clinic sharing feature we don't actually need.

## Decision
Remove the `patients` table entirely. All patient data — personal information (name, DNI, phone, email, date of birth) and per-clinic metadata (blacklist status, no-show count, insurance, tags) — now lives in `clinic_patients`.

- DNI is unique **per clinic** (`UNIQUE(clinic_id, dni)`), not globally.
- Each clinic owns their patient records independently. There is no cross-clinic data sharing.
- `clinic_patients` is now a standalone table, not a junction table.

**Supersedes**: [ADR-005 (Global Patients)](005-global-patients.md)

## Alternatives Considered
- **Keep global + junction (ADR-005)**: The existing approach. Rejected because cross-clinic patient sharing adds complexity we don't need and creates data ownership problems.
- **Global patients with immutable core data**: Lock personal fields after creation so no clinic can change shared data. Rejected because it's overly rigid and still requires the JOIN overhead.
- **Clinic-owned with optional deduplication later**: The chosen approach. Start simple with full isolation. If cross-clinic deduplication is ever needed, it can be built as an explicit merge feature on top.

## Consequences
- **Simpler queries**: No JOINs needed to get full patient data. Single table access for all patient operations.
- **Full clinic isolation**: Each clinic's patient data is completely independent. Editing a patient at Clinic A has zero effect on Clinic B.
- **DNI is editable**: Since DNI uniqueness is per-clinic, correcting a typo in a DNI doesn't affect other clinics.
- **No cross-clinic sharing**: If a patient visits two clinics, they exist as two separate records. This is an acceptable trade-off for simplicity.
- **Simpler code**: No upsert logic, no junction table JOINs, no global-vs-local data split to manage.
- **Table count drops from 13 to 12**.
