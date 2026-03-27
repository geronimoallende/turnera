# ADR-010: Use External BSP (YCloud) Before Embedded Signup

## Status
Accepted

## Context
To offer Embedded Signup (where clinics connect WhatsApp from our UI), we need to register as a Meta Tech Provider. This process is difficult and time-consuming. We need WhatsApp working before that.

## Decision
Start with an external BSP like **YCloud** for WhatsApp API access. Each clinic connects their number through YCloud's platform. Migrate to our own Embedded Signup later when we become a Meta Tech Provider.

## Phases
1. **Now**: Use YCloud (or similar BSP). Clinics onboard via YCloud's Embedded Signup flow. We store the YCloud-provided credentials.
2. **Later**: Register as Meta Tech Provider. Build our own Embedded Signup. Migrate clinics.

## Consequences
- Dependency on YCloud (or chosen BSP) initially
- BSP adds a cost layer (YCloud: no message markup, platform fee ~$49-99/month)
- Simpler onboarding for us — YCloud handles the Meta complexity
- `clinics` table stores BSP-agnostic fields (phone_number_id, waba_id work regardless of BSP)
- When migrating to direct Meta API later, only the auth/connection layer changes, not the message sending logic
