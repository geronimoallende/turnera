# ADR-005: Global Patients with Per-Clinic Junction Table

## Status
Accepted

## Context
A patient might visit Clinic A and Clinic B in the same city. A doctor might work at both clinics. The original design had `patients.clinic_id` — one patient belongs to one clinic. This breaks cross-clinic scenarios.

## Decision
Patients and doctors are **global** (no `clinic_id` on their core tables). Junction tables provide per-clinic metadata:

- `clinic_patients`: blacklist status, no-show count, insurance, tags, CRM data
- `staff_clinics`: role per clinic
- `doctor_clinic_settings`: fee, slot duration, overbooking per clinic

DNI is the natural unique key for patients. If Juan (DNI: 12345678) visits both clinics, he's ONE record in `patients` with TWO records in `clinic_patients`.

## Alternatives Considered
- **Patients duplicated per clinic**: Simple but duplicate data, no deduplication by DNI.
- **Fully global (no per-clinic data)**: Blacklisting at one clinic would be visible to all. Privacy violation between clinics.
- **Global + junction (chosen)**: Clean separation. DNI deduplication. Per-clinic privacy.

## Consequences
- Patient creation is an upsert: check DNI first, create if not exists, then link to clinic
- RLS on `patients` must go through `clinic_patients` junction (slightly more complex policies)
- Blacklist is fully per-clinic — Clinic A cannot see Clinic B's blacklist
- A trigger auto-increments `no_show_count` per clinic when an appointment is marked no-show
