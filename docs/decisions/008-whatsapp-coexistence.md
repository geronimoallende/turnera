# ADR-008: WhatsApp Coexistence Mode via Embedded Signup

## Status
Accepted

## Context
Each clinic needs to connect their WhatsApp number to the system for the chatbot and reminders. There are two paths: full API migration (clinic loses WhatsApp Business app access) or Coexistence (both app and API work in parallel).

## Decision
Use **Coexistence mode** with **Embedded Signup**. Each clinic connects their own number via a self-service flow in the Settings page. The clinic keeps using their WhatsApp Business app while our API handles chatbot and reminders.

## Alternatives Considered
- **Full API migration**: Clinic loses app access. Simpler technically but unacceptable for small clinics that want to respond from their phone.
- **Centralized number (like AgendaPro)**: All reminders from one Althem number. Less personal, clinic loses brand presence.
- **Coexistence (chosen)**: Best of both worlds. Clinic keeps their app, bot handles automation.

## Consequences
- Per-clinic WABA data stored in `clinics` table (phone_number_id, waba_id, business_id)
- Althem must register as Meta Tech Provider for Embedded Signup
- 5 MPS throughput limit (vs 80 MPS for API-only) — fine for clinics
- Client must open WhatsApp Business app every 14 days
- Bot-to-human handoff: when staff replies from app, bot pauses via echo webhook detection
- No Meta verification needed for <50 appointments/day
- Broadcast lists disabled in Coexistence (use API templates instead)

## References
- `studies/Guia_Onboarding_WhatsApp_Clientes_SaaS.md`
