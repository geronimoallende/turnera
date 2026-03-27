# ADR-007: Payment Marking by Secretary/Admin Only

## Status
Accepted

## Context
Appointments have a `payment_status` field (pending/paid/partial/waived). Who should be able to change it?

## Decision
Only **secretary** and **admin** can mark payments. Doctors see payment status as **read-only**.

## Alternatives Considered
- **Everyone (doctor + secretary + admin)**: Useful for solo practices without a secretary. Less accountability.
- **Configurable per clinic**: Max flexibility but adds complexity to settings and RLS.
- **Secretary + admin only (chosen)**: Matches how most Argentine clinics work — patient pays at the front desk.

## Consequences
- A database trigger (`check_payment_update`) enforces this — even if the app has a bug, the DB rejects doctor payment changes
- `payment_updated_by` and `payment_updated_at` columns track who changed it (audit trail)
- The UI shows payment badges to doctors but disables the payment form
