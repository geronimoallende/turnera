# ADR-001: Custom Calendar in Supabase Instead of Google Calendar

## Status
Accepted

## Context
We need a calendar system for appointment scheduling. Google Calendar API is an option but has limitations for our use case.

## Decision
Build a custom calendar with appointments stored in Supabase, rendered with FullCalendar.

## Alternatives Considered
- **Google Calendar API**: Limited to basic event CRUD. Doesn't support waitlists, overbooking, CRM integration, or chatbot queries natively. Rate limits on API calls. Syncing two-way is complex.
- **Cal.com**: Open-source but opinionated about booking flow. Hard to customize for medical-specific workflows.

## Consequences
- Full control over appointment data and logic
- Chatbot can query available slots directly from Supabase
- Waitlist, overbooking, CRM metadata all in one place
- Google Calendar one-way sync deferred to Phase 4
