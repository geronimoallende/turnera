# Developer Setup Guide

Everything you need to start working on Turnera.

---

## 1. Prerequisites

Install these before anything else:

| Tool | Version | How to install | What it's for |
|------|---------|---------------|---------------|
| **Node.js** | 20+ | https://nodejs.org (LTS) | Runs JavaScript/TypeScript |
| **Git** | Any | https://git-scm.com | Version control |
| **VS Code** | Any | https://code.visualstudio.com | Code editor (recommended) |

### VS Code Extensions (recommended)

- **ESLint** — shows code errors inline
- **Tailwind CSS IntelliSense** — autocomplete for CSS classes
- **Prettier** — auto-formats code on save
- **GitLens** — shows who changed each line and when

---

## 2. Clone and Install

```bash
# Clone the repository
git clone https://github.com/geronimoallende/turnera.git
cd turnera

# Install dependencies (downloads all packages from package.json)
npm install
```

This creates a `node_modules/` folder with ~900 packages. It takes 30-60 seconds. You never need to touch this folder — it's auto-generated.

---

## 3. Environment Variables

Copy the example file and fill in the real values:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with the real keys. Ask Geronimo for the values.

| Variable | Where to get it | What it does |
|----------|----------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API | URL of the database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page | Public key for browser requests (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page | Secret key that bypasses RLS (**never expose**) |
| `NEXT_PUBLIC_SENTRY_DSN` | sentry.io → Project → Client Keys | Where error reports go (optional for dev) |
| `SENTRY_AUTH_TOKEN` | sentry.io → Account → Auth Tokens | For uploading source maps (optional for dev) |

**IMPORTANT:** `.env.local` is in `.gitignore` — it will NEVER be committed to git. That's intentional. Secrets must not go in git.

---

## 4. Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser. You should see the login page.

**What `npm run dev` does:**
1. Starts a local Next.js server on port 3000
2. Watches for file changes — when you save a file, the browser auto-refreshes
3. TypeScript errors show as red overlays in the browser
4. Logs appear in the terminal where you ran the command

**To stop the server:** Press `Ctrl + C` in the terminal.

---

## 5. Login Credentials

The database has seed data with test users. Ask Geronimo for the test credentials (email + password) for each role:

- **Admin** — can do everything
- **Secretary** — can manage patients and appointments, mark payments
- **Doctor** — read-only on patients, manages own schedule

---

## 6. Project Structure

```
turnera/
├── docs/                    # Documentation (you're reading it)
├── supabase/migrations/     # SQL database migrations
├── src/
│   ├── app/                 # Pages and API routes (Next.js App Router)
│   │   ├── (auth)/login/    # Login page
│   │   ├── (dashboard)/     # All dashboard pages (patients, doctors, etc.)
│   │   └── api/             # Backend API routes
│   ├── components/          # React UI components
│   │   ├── ui/              # shadcn/ui base components (button, card, input)
│   │   ├── layout/          # Sidebar, Topbar
│   │   ├── patients/        # Patient-related components
│   │   └── doctors/         # Doctor-related components
│   ├── lib/                 # Shared utilities
│   │   ├── supabase/        # Database client (client.ts, server.ts, admin.ts)
│   │   ├── hooks/           # React Query hooks (usePatients, useDoctors)
│   │   ├── types/           # TypeScript types (database.ts is auto-generated)
│   │   ├── auth/            # Permission checking
│   │   ├── logger.ts        # Pino structured logger
│   │   └── error-handler.ts # Centralized API error handling
│   └── providers/           # React context providers (auth, clinic)
├── next.config.ts           # Next.js config + security headers
├── sentry.*.config.ts       # Sentry error tracking configs
├── package.json             # Dependencies and scripts
└── CLAUDE.md                # AI assistant instructions
```

### Key concepts

**App Router:** Next.js uses the folder structure to create URLs. `src/app/(dashboard)/patients/page.tsx` becomes `http://localhost:3000/dashboard/patients`. Folders in parentheses like `(dashboard)` are "route groups" — they add a shared layout (sidebar + topbar) but don't appear in the URL.

**API Routes:** Files at `src/app/api/*/route.ts` are backend endpoints. `src/app/api/patients/route.ts` handles `GET /api/patients` and `POST /api/patients`. They run on the server, not in the browser.

**Server vs Client Components:** By default, components run on the server (faster, can access the database directly). If a component needs interactivity (useState, onClick, hooks), add `"use client"` at the top.

---

## 7. Available Scripts

Run these from the project root:

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start development server (http://localhost:3000) |
| `npm run build` | Build for production (also checks TypeScript errors) |
| `npm run lint` | Check code quality with ESLint |
| `npx tsx tools/scripts/seed.ts` | Populate database with sample data |
| `npx tsx tools/scripts/create-user.ts` | Create a staff user |
| `npx tsx tools/scripts/create-clinic.ts` | Create a new clinic tenant |

---

## 8. Tech Stack

| What | Technology | Docs |
|------|-----------|------|
| Framework | Next.js 16 (App Router) | https://nextjs.org/docs |
| Language | TypeScript | https://typescriptlang.org |
| UI Components | shadcn/ui + Tailwind CSS | https://ui.shadcn.com |
| Database | Supabase (PostgreSQL + RLS) | https://supabase.com/docs |
| Auth | Supabase Auth (JWT in cookies) | https://supabase.com/docs/guides/auth |
| Data Fetching | React Query (TanStack Query v5) | https://tanstack.com/query |
| Forms | react-hook-form + zod | https://react-hook-form.com |
| Calendar | FullCalendar | https://fullcalendar.io/docs |
| Error Tracking | Sentry | https://docs.sentry.io/platforms/javascript/guides/nextjs |
| Logging | Pino | https://getpino.io |

---

## 9. Database

### Connection

The app connects to Supabase (a hosted PostgreSQL database). You don't need to install PostgreSQL locally. All queries go through the Supabase SDK, which handles authentication and RLS (Row Level Security) automatically.

### Tables (17)

The database has 17 tables. The most important ones:

| Table | What it stores |
|-------|---------------|
| `clinics` | Tenant config (name, address, WhatsApp settings) |
| `staff` | Staff identity (name, email — global) |
| `staff_clinics` | Which staff belongs to which clinic + their role |
| `doctors` | Doctor profiles (specialty, license number) |
| `clinic_patients` | Patient data per clinic (each clinic owns their patients) |
| `appointments` | Appointments (the core table) |
| `doctor_schedules` | Weekly recurring availability |
| `patient_history` | Immutable audit log of every patient data change |

### Multi-Tenancy

Every per-clinic table has a `clinic_id` column. RLS policies filter automatically — you can only see data from clinics you belong to. This means Clinic A can never see Clinic B's patients, even if they share the same database.

### Migrations

Database changes are tracked as SQL files in `supabase/migrations/`. See the [README](../supabase/migrations/README.md) for the full migration history.

### Regenerating TypeScript Types

When the database schema changes, regenerate the types:

```bash
npx supabase gen types typescript --project-id lavfzixecvbvdqxyiwwl > src/lib/types/database.ts
```

This updates `src/lib/types/database.ts` — a file that tells TypeScript what tables and columns exist. When you write `supabase.from("clinic_patients").select("first_name")`, TypeScript knows `first_name` is a valid column because of this file.

---

## 10. How API Routes Work

All API routes follow the same pattern:

```typescript
// src/app/api/patients/route.ts

import { withErrorHandler, ApiError } from "@/lib/error-handler"

export const GET = withErrorHandler(async (request) => {
  // 1. Validate input with zod (.parse throws if invalid → caught by wrapper → 400)
  const { clinic_id } = schema.parse(params)

  // 2. Query database
  const { data, error } = await supabase.from("clinic_patients").select(...)

  // 3. Handle database errors
  if (error) throw new ApiError(error.message, 500, "DB_ERROR")

  // 4. Return data
  return NextResponse.json({ data })
})
```

**`withErrorHandler()`** wraps every route and:
- Generates a unique `requestId` for tracing
- Catches validation errors (ZodError) → returns 400
- Catches intentional errors (ApiError) → returns the specified status
- Catches unexpected crashes → logs to Pino + reports to Sentry → returns 500
- Logs every request with duration, method, URL, status

**Error responses** always have the same shape:
```json
{ "error": "Patient not found", "code": "NOT_FOUND", "requestId": "a1b2c3d4" }
```

---

## 11. How Auth Works

1. User logs in with email/password → Supabase creates a JWT (JSON Web Token)
2. JWT is stored in an httpOnly cookie (browser sends it automatically)
3. Every request goes through `proxy.ts` which refreshes the JWT if it's expiring
4. API routes read the JWT to know who's logged in
5. RLS policies use the JWT to filter data by clinic

### Roles

| Role | Can do |
|------|--------|
| Admin | Everything |
| Secretary | Manage patients, book appointments, mark payments |
| Doctor | View own appointments, manage own schedule. Read-only on patients |

Role checking in API routes:
```typescript
const permission = await checkDoctorPermission(supabase, clinic_id, doctorId)
if (!permission.authorized) throw new ApiError(permission.error, permission.status, "FORBIDDEN")
```

---

## 12. How Observability Works

### Error Tracking (Sentry)

When something crashes, Sentry captures it automatically:
- **Browser errors** → `sentry.client.config.ts`
- **API route errors** → `withErrorHandler()` sends unknown errors to Sentry
- **React crashes** → error boundaries (`global-error.tsx`, `(dashboard)/error.tsx`) capture and report

In production, go to https://sentry.io to see all errors, stack traces, and user sessions.

### Structured Logging (Pino)

All logs use the Pino logger (`src/lib/logger.ts`) which outputs JSON:

```typescript
import { logger } from "@/lib/logger"

logger.info("something happened")
logger.error({ clinicId, error: err.message }, "database query failed")
```

Output: `{"level":30,"time":1712345678,"service":"turnera-web","msg":"something happened"}`

### Security Headers

Every HTTP response includes security headers (X-Frame-Options, HSTS, etc.) configured in `next.config.ts`. These protect against clickjacking, MIME sniffing, and protocol downgrade attacks.

---

## 13. Common Tasks

### Add a new page

1. Create a folder in `src/app/(dashboard)/your-page/`
2. Add `page.tsx` inside it
3. It's automatically available at `/dashboard/your-page`

### Add a new API route

1. Create `src/app/api/your-route/route.ts`
2. Use the `withErrorHandler` pattern (see Section 10)
3. Validate input with zod
4. Use `throw new ApiError(...)` for errors

### Add a UI component

1. For shadcn/ui components: `npx shadcn@latest add button` (or whatever component)
2. For custom components: create a file in `src/components/your-feature/`

### Modify the database

1. Write a SQL migration file in `supabase/migrations/` (e.g., `018_add_new_table.sql`)
2. Apply it: ask Geronimo or use the Supabase MCP tool
3. Regenerate types: `npx supabase gen types typescript --project-id lavfzixecvbvdqxyiwwl > src/lib/types/database.ts`

---

## 14. Git Workflow

```bash
# Before starting work, pull latest changes
git pull origin main

# Create a branch for your work
git checkout -b feature/your-feature-name

# Make changes, then stage and commit
git add src/app/api/your-route/route.ts
git commit -m "feat: add your feature description"

# Push your branch
git push origin feature/your-feature-name

# Create a Pull Request on GitHub
```

### Commit message format

```
type: short description

type = feat (new feature), fix (bug fix), refactor (code change, no new behavior),
       docs (documentation), chore (dependencies, config)
```

### What NOT to commit

- `.env.local` — secrets (already in .gitignore)
- `node_modules/` — dependencies (already in .gitignore)
- `.next/` — build cache (already in .gitignore)
- Database passwords, API keys, tokens — never hardcode in source files

---

## 15. Troubleshooting

### `npm run dev` fails

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Build fails with type errors

```bash
# Delete build cache and retry
rm -rf .next
npm run build
```

### Database queries return empty results

Check that:
1. Your `.env.local` has the correct Supabase keys
2. You're logged in (check the browser cookies)
3. The user belongs to the clinic you're querying (RLS filters by `clinic_id`)

### "Module not found" error

```bash
# Reinstall dependencies
npm install
```

### OneDrive locks `.next` files (Windows)

The project is in a OneDrive folder. Sometimes OneDrive locks build cache files:
```
EPERM: operation not permitted, unlink '.next/static/...'
```

Solution: just run `npm run build` again without deleting `.next`. If it persists, close VS Code, wait 5 seconds, and retry.

---

## 16. Architecture Decisions

All major technical decisions are documented in `docs/decisions/`:

| ADR | Decision |
|-----|----------|
| 002 | Multi-tenancy via clinic_id + RLS |
| 003 | Staff-only auth (patients don't log in) |
| 007 | Only admin/secretary can mark payments |
| 011 | Patients owned per-clinic (no global patient table) |
| 012 | Python/FastAPI for AI backend (replaces n8n) |

Read these before making changes that affect the architecture.

---

## 17. Questions?

- Check `docs/` for detailed documentation
- Check `CLAUDE.md` for project context and conventions
- Ask Geronimo for database credentials, Sentry access, or architecture questions
