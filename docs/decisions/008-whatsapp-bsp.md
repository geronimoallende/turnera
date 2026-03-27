# ADR-008: WhatsApp via External BSP Initially

## Status
Accepted

## Context
To send/receive WhatsApp messages via API, you need either:
- Be a Meta Tech Provider (difficult, requires approval process)
- Use an external BSP (Business Solution Provider) like YCloud

## Decision
Start with an external BSP (YCloud or similar). Each clinic connects via the BSP's platform. BSP credentials stored in `clinics` table. Migrate to direct Meta integration later if needed.

## Alternatives Considered
- **Meta Tech Provider from day one**: Maximum control, lower cost per message. But approval process is long and complex.
- **External BSP (chosen)**: Quick setup, handles compliance, provides coexistence mode (clinic keeps WhatsApp Business app while API runs in parallel).

## Consequences
- Per-message cost is slightly higher (BSP markup)
- Dependency on BSP's uptime and API
- Faster time-to-market
- Each clinic's BSP credentials stored securely in `clinics` table
- n8n workflows use BSP's API endpoints
