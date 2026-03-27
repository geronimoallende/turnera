# ADR-009: No Billing/Subscription Tables for Now

## Status
Accepted

## Context
The market study recommends freemium pricing with tiers. Should we add subscription management tables to the database?

## Decision
Skip billing tables entirely for now. Everyone gets full access during development. Add billing when ready to sell.

## Consequences
- No plan limits enforced in the app
- No subscription tracking
- When billing is needed later, add tables and Mercado Pago integration
- This avoids premature complexity — billing is a feature that can be cleanly added on top
