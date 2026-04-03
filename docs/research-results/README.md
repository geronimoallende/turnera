# Research Results

Deep research results for the Turnera project. Each topic was researched independently by Claude (deep research on claude.ai) and Gemini (deep research on Google AI Studio). Files with the same number cover the same topic from different AIs.

Completed: 2026-03-30

## Sanatorio System (Phase 5)

Research for the sanatorio expansion module — DICOM, PACS, laws, dictation, market, middleware.

| # | Topic | Claude | Gemini | Prompt source |
|---|-------|--------|--------|---------------|
| 01 | DICOM Protocol & Medical Device Connectivity | [claude](sanatorio/01-dicom-device-integration-claude.md) | [gemini](sanatorio/01-dicom-device-integration-gemini.md) | `docs/deep-research-prompts.md` #1 |
| 02 | RIS/PACS Architecture & Open-Source Solutions | [claude](sanatorio/02-ris-pacs-open-source-claude.md) | [gemini](sanatorio/02-ris-pacs-open-source-gemini.md) | `docs/deep-research-prompts.md` #2 |
| 03 | Argentine Medical Data Laws & Compliance | [claude](sanatorio/03-argentine-medical-laws-claude.md) | [gemini](sanatorio/03-argentine-medical-laws-gemini.md) | `docs/deep-research-prompts.md` #3 |
| 04 | AI Medical Dictation in Spanish | [claude](sanatorio/04-ai-medical-dictation-claude.md) | [gemini](sanatorio/04-ai-medical-dictation-gemini.md) | `docs/deep-research-prompts.md` #4 |
| 05 | Argentine Medical Software Market & Competition | [claude](sanatorio/05-medical-software-market-claude.md) | [gemini](sanatorio/05-medical-software-market-gemini.md) | `docs/deep-research-prompts.md` #5 |
| 06 | Medical Integration Middleware & Non-Imaging Devices | [claude](sanatorio/06-medical-middleware-claude.md) | [gemini](sanatorio/06-medical-middleware-gemini.md) | `docs/deep-research-prompts.md` #6 |

## Turnera UX (Phases 1-3)

Research for the core turnera product — calendar UI, booking flows, patient management, dashboard.

| # | Topic | Claude | Gemini | Prompt source |
|---|-------|--------|--------|---------------|
| 01 | Calendar & Scheduling Interface Patterns | [claude](turnera-ux/01-calendar-scheduling-ui-claude.md) | [gemini](turnera-ux/01-calendar-scheduling-ui-gemini.md) | `docs/deep-research-turnera-ux.md` #1 |
| 02 | Appointment Booking & Management Flows | [claude](turnera-ux/02-appointment-booking-flows-claude.md) | [gemini](turnera-ux/02-appointment-booking-flows-gemini.md) | `docs/deep-research-turnera-ux.md` #2 |
| 03 | Patient Management & CRM | [claude](turnera-ux/03-patient-management-crm-claude.md) | [gemini](turnera-ux/03-patient-management-crm-gemini.md) | `docs/deep-research-turnera-ux.md` #3 |
| 04 | Dashboard, Reports & Notifications | [claude](turnera-ux/04-dashboard-reports-notifications-claude.md) | [gemini](turnera-ux/04-dashboard-reports-notifications-gemini.md) | `docs/deep-research-turnera-ux.md` #4 |


## Technical

Research on infrastructure, APIs, and platform integration.

| # | Topic | Source | Notes |
|---|-------|--------|-------|
| 01 | WhatsApp Business API Patterns | [claude](technical/01-whatsapp-business-api-claude.md) | BSP comparison, conversation flows, webhook patterns |
| 02 | Multi-Tenant Scaling with Supabase | [claude](technical/02-multi-tenant-scaling-claude.md) | RLS performance, connection pooling, scaling path |
| 03 | Notification Systems | [claude](technical/03-notification-systems-claude.md) | pg_cron vs external, WhatsApp vs email vs SMS |
| 04 | Offline-First Architecture | [claude](technical/04-offline-reliability-claude.md) | Service workers, Dexie.js, Serwist, offline patterns |
| 05 | Meta Tech Provider Guide (Argentina) | [compass](technical/05-meta-tech-provider-guide-compass.md) | SAS setup, Meta onboarding, Embedded Signup, Cloud API from Python, billing model |
| 06 | WhatsApp Automation Scenarios (6 compared) | [compass](technical/06-whatsapp-automation-scenarios-compass.md) | YCloud vs ManyChat vs Chatwoot vs Meta API, coexistence mode, pricing |

## Operations

| # | Topic | Source |
|---|-------|--------|
| 01 | Secretary Daily Workflow | [claude](operations/01-secretary-daily-workflow-claude.md) |
| 02 | Obras Sociales System | [claude](operations/02-obras-sociales-system-claude.md) |
| 03 | Sanatorio Operations | [claude](operations/03-sanatorio-operations-claude.md) |
| 04 | Specialty Workflows | [claude](operations/04-specialty-workflows-claude.md) |

## Business

| # | Topic | Source |
|---|-------|--------|
| 01 | Sales Strategy | [claude](business/01-sales-strategy-claude.md) |
| 02 | Pricing Models | [claude](business/02-pricing-models-claude.md) |
| 03 | Onboarding & Migration | [claude](business/03-onboarding-migration-claude.md) |

## Patient Experience

| # | Topic | Source |
|---|-------|--------|
| 01 | Patient Self-Scheduling | [claude](patient-experience/01-patient-self-scheduling-claude.md) |
| 02 | Patient Portal | [claude](patient-experience/02-patient-portal-claude.md) |

## Notes

- Gemini results tend to be longer and more detailed (60-120KB vs 20-42KB for Claude)
- Claude results tend to be more opinionated with clearer recommendations
- For implementation decisions, read both and cross-reference — they sometimes disagree
- Gemini files were converted from .docx to .md via pandoc; some ASCII diagrams may have formatting artifacts
