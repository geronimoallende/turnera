---
title: "Pending Technical Research — Architecture Gaps"
date: 2026-03-30
---

# Pending Technical Research

Topics not covered by the 20 completed deep research sessions. These are implementation-level concerns to investigate before or during development of the relevant phases.

---

## 1. Auth & Real-Time Collaboration

**Why it matters:** Getting this wrong early is expensive to fix. Affects every page.

- Multi-tenant Supabase Auth patterns — session management, token refresh, role enforcement
- Two secretaries booking the same slot simultaneously — how to prevent it
- Supabase Realtime patterns for multi-user calendar sync
- Optimistic UI updates — show action as done before server confirms
- Conflict resolution when two users edit the same record

---

## 2. Testing Strategy for Medical Software

**Why it matters:** RLS bugs can expose patient data across clinics. Must be tested.

- RLS policy integration tests — verify clinic isolation actually works
- E2E booking flow tests (Playwright or Cypress)
- Load testing for concurrent users (10 secretaries across 10 clinics)
- Test data generation — realistic patient/appointment seeds

---

## 3. CI/CD & Deployment Patterns

**Why it matters:** Safe deployments matter when clinics depend on the system daily.

- Vercel + Supabase migration workflow — how to safely run migrations on deploy
- Rollback strategy — what to do when a migration breaks production
- Staging environment setup — test against real Supabase data safely
- Feature flags — how to ship features to one clinic before all

---

## 4. Reporting Computation at Scale

**Why it matters:** Naive SQL aggregations get slow. Reports must feel instant.

- Materialized views in Supabase for pre-aggregated stats
- Cron-based aggregations (Supabase Edge Functions + pg_cron)
- Which reports can be computed on-the-fly vs need pre-computation
- Efficient report generation for the 5 dashboards planned

---

## 5. Data Export & Interoperability

**Why it matters:** Clinics need to extract their data. Obra social billing depends on exports.

- CSV/PDF export patterns from Next.js API routes
- Obra social portal integration feasibility (OSDE, Swiss Medical, PAMI)
- Patient data portability (Ley 26.529 — 48-hour delivery obligation)

---

## 6. Accessibility (WCAG)

**Why it matters:** Secretaries use this 8 hours/day. Doctors may have varying needs.

- WCAG 2.1 AA compliance for medical scheduling interfaces
- Screen reader support for the calendar view
- Keyboard navigation for appointment creation flow
- Color contrast ratios for status indicators (green/yellow/red/gray)
