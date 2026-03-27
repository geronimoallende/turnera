# ADR-004: Tech Stack

## Status
Accepted

## Decision
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Calendar**: @fullcalendar/react
- **Database**: Supabase (PostgreSQL + RLS + Realtime + Auth)
- **Chatbot**: n8n (existing EasyPanel VPS)
- **Hosting**: Vercel (via GitHub auto-deploy)
- **Forms**: react-hook-form + zod
- **Charts**: recharts
- **PDF**: @react-pdf/renderer
- **Dates**: date-fns + date-fns-tz

## Why
- Next.js + Vercel: Zero-config deployment, SSR for dashboard performance
- Supabase: Already in use for chatbot SaaS, same project, RLS for multi-tenancy
- shadcn/ui: Unstyled by default, easy to customize per clinic later
- FullCalendar: Most mature React calendar library, drag-drop, multiple views
