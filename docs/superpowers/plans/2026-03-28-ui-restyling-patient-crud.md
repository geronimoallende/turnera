# UI Restyling + Patient CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the existing UI to a blue/white Obsidian-flat design, then build Patient CRUD (list, create, edit) with search-first approach.

**Architecture:** API routes on the server fetch data from Supabase via the server client. React Query hooks on the client call those API routes. Pages use the hooks to display and mutate data. The `/frontend-design` skill MUST be used for all UI components.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase, React Query, react-hook-form, zod

---

## File Map

### Modified files:
- `src/app/globals.css` — Update CSS variables for blue primary color
- `src/components/layout/sidebar.tsx` — Blue background, white text
- `src/components/layout/topbar.tsx` — Compact flat style
- `src/app/(auth)/login/page.tsx` — Blue button, flat card
- `src/app/(dashboard)/dashboard/page.tsx` — Flat style placeholder

### New files:
- `src/app/api/patients/route.ts` — GET (list/search) + POST (create)
- `src/app/api/patients/[id]/route.ts` — GET (single) + PUT (update)
- `src/lib/hooks/use-patients.ts` — React Query hooks
- `src/components/patients/patient-table.tsx` — Table for patient list
- `src/components/patients/patient-search.tsx` — Search input
- `src/components/patients/patient-form.tsx` — Reusable form (create + edit)
- `src/app/(dashboard)/patients/page.tsx` — Patient list page
- `src/app/(dashboard)/patients/new/page.tsx` — Create patient page
- `src/app/(dashboard)/patients/[id]/page.tsx` — Edit patient page

---

## Task 1: Update shadcn/ui Theme to Blue

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update CSS variables for blue primary**

In `src/app/globals.css`, replace the `:root` primary and related variables. The key changes are `--primary` (currently dark gray) to blue-500, and adjusting border/ring colors:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.141 0.005 285.823);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.546 0.245 262.881);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0.001 286.375);
  --secondary-foreground: oklch(0.21 0.006 285.885);
  --muted: oklch(0.97 0.001 286.375);
  --muted-foreground: oklch(0.552 0.016 285.938);
  --accent: oklch(0.97 0.001 286.375);
  --accent-foreground: oklch(0.21 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.91 0.002 286.375);
  --input: oklch(0.91 0.002 286.375);
  --ring: oklch(0.546 0.245 262.881);
  --chart-1: oklch(0.546 0.245 262.881);
  --chart-2: oklch(0.488 0.243 264.376);
  --chart-3: oklch(0.439 0.218 265.638);
  --chart-4: oklch(0.398 0.195 266.545);
  --chart-5: oklch(0.37 0.175 267.093);
  --radius: 0.5rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.141 0.005 285.823);
  --sidebar-primary: oklch(0.546 0.245 262.881);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0.001 286.375);
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);
  --sidebar-border: oklch(0.91 0.002 286.375);
  --sidebar-ring: oklch(0.546 0.245 262.881);
}
```

Note: `oklch(0.546 0.245 262.881)` is blue-500 (`#3b82f6`) in OKLCH format. The `--radius` is reduced from `0.625rem` to `0.5rem` for a tighter look.

- [ ] **Step 2: Verify the app still runs**

Run: `npm run dev`
Expected: App starts without errors. Login button should now appear blue.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: update shadcn theme to blue-500 primary color"
```

---

## Task 2: Restyle Sidebar

**Files:**
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Update sidebar background and text colors**

Replace the `<aside>` className and all link styling. The full updated component:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useClinic } from "@/providers/clinic-provider"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Stethoscope,
  Clock,
  BarChart3,
  Settings,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Appointments", href: "/appointments", icon: ClipboardList },
  { label: "Patients", href: "/patients", icon: Users },
  { label: "Doctors", href: "/doctors", icon: Stethoscope },
  { label: "Waitlist", href: "/waitlist", icon: Clock },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin"] as const,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { activeRole } = useClinic()

  return (
    <aside className="flex h-full w-64 flex-col bg-blue-800">
      {/* Logo / App name at the top */}
      <div className="flex h-14 items-center border-b border-blue-700 px-4">
        <Link href="/dashboard" className="text-xl font-semibold text-white">
          Turnera
        </Link>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems
          .filter((item) => {
            if (!item.roles) return true
            return activeRole ? item.roles.includes(activeRole as "admin") : false
          })
          .map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
      </nav>
    </aside>
  )
}
```

Key changes:
- `aside`: `border-r bg-white` → `bg-blue-800`
- Logo: `text-xl font-semibold` → add `text-white`
- Border: `border-b` → `border-b border-blue-700`
- Active link: `bg-gray-100 text-gray-900` → `bg-blue-600 text-white`
- Inactive link: `text-gray-600 hover:bg-gray-50 hover:text-gray-900` → `text-blue-100 hover:bg-blue-700 hover:text-white`

- [ ] **Step 2: Verify sidebar looks correct**

Run: `npm run dev`, navigate to dashboard.
Expected: Blue sidebar with white text, active link highlighted in lighter blue.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/sidebar.tsx
git commit -m "style: restyle sidebar to blue-800 background with white text"
```

---

## Task 3: Restyle Topbar and Login Page

**Files:**
- Modify: `src/components/layout/topbar.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Make topbar more compact**

In `src/components/layout/topbar.tsx`, the topbar is already white with a border. The only change is ensuring it uses the flat style. Replace the header className:

```tsx
<header className="flex h-12 items-center justify-between border-b px-4">
```

Change: `h-14` → `h-12` for a more compact look.

- [ ] **Step 2: Update login page button and card**

In `src/app/(auth)/login/page.tsx`, the Button already uses the `primary` variant by default, which is now blue from our CSS change. No color changes needed. But remove any shadow from the Card by adding `shadow-none`:

Replace:
```tsx
<Card className="w-full max-w-sm">
```
With:
```tsx
<Card className="w-full max-w-sm shadow-none border">
```

- [ ] **Step 3: Update dashboard placeholder**

In `src/app/(dashboard)/dashboard/page.tsx`, update the placeholder card to match flat style:

Replace:
```tsx
<div className="rounded-lg border bg-white p-8 text-center text-gray-500">
```
With:
```tsx
<div className="rounded-md border bg-white p-8 text-center text-gray-500">
```

Change: `rounded-lg` → `rounded-md` for tighter corners.

- [ ] **Step 4: Also update dashboard layout height to match topbar**

In `src/app/(dashboard)/layout.tsx`, the sidebar height reference should still work since it uses `h-screen`. No change needed here, but verify the topbar height change from `h-14` to `h-12` in the topbar matches visually with the sidebar header. Update sidebar header to match:

In `src/components/layout/sidebar.tsx`, change:
```tsx
<div className="flex h-14 items-center border-b border-blue-700 px-4">
```
To:
```tsx
<div className="flex h-12 items-center border-b border-blue-700 px-4">
```

- [ ] **Step 5: Verify all restyled components**

Run: `npm run dev`
Expected:
- Login page: blue "Sign in" button, flat card with no shadow
- Dashboard: blue sidebar, compact topbar, flat placeholder card
- Sidebar and topbar heights match

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/topbar.tsx src/app/(auth)/login/page.tsx src/app/(dashboard)/dashboard/page.tsx src/components/layout/sidebar.tsx
git commit -m "style: restyle topbar, login page, and dashboard to flat Obsidian-inspired design"
```

---

## Task 4: Patient API Routes — List and Create

**Files:**
- Create: `src/app/api/patients/route.ts`

- [ ] **Step 1: Create the patients API directory**

Run: `mkdir -p src/app/api/patients`

- [ ] **Step 2: Write GET and POST handlers**

Create `src/app/api/patients/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/patients?clinic_id=xxx&search=garcia&page=1&limit=20
 *
 * Returns paginated list of patients for a clinic.
 * Joins patients with clinic_patients to get per-clinic metadata.
 * Search filters by first_name, last_name, or DNI (case-insensitive).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { searchParams } = request.nextUrl
  const clinicId = searchParams.get("clinic_id")
  const search = searchParams.get("search") || ""
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "20", 10)

  if (!clinicId) {
    return NextResponse.json({ error: "clinic_id is required" }, { status: 400 })
  }

  const offset = (page - 1) * limit

  // Build query: join patients with clinic_patients for this clinic
  let query = supabase
    .from("clinic_patients")
    .select(
      `
      id,
      blacklist_status,
      no_show_count,
      insurance_provider,
      insurance_plan,
      insurance_member_number,
      notes,
      tags,
      patient_type,
      frequency,
      patients (
        id,
        first_name,
        last_name,
        dni,
        phone,
        email,
        whatsapp_phone,
        date_of_birth,
        gender,
        blood_type,
        allergies
      )
    `,
      { count: "exact" }
    )
    .eq("clinic_id", clinicId)
    .order("patients(last_name)", { ascending: true })
    .range(offset, offset + limit - 1)

  // Apply search filter if provided
  if (search) {
    // Search by DNI (exact prefix) or name (case-insensitive contains)
    query = query.or(
      `patients.first_name.ilike.%${search}%,patients.last_name.ilike.%${search}%,patients.dni.ilike.%${search}%`
    )
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    patients: data || [],
    total: count || 0,
    page,
    limit,
  })
}

/**
 * POST /api/patients
 *
 * Body: { first_name, last_name, dni, phone?, clinic_id }
 *
 * Upsert logic:
 * 1. If DNI exists globally AND already linked to this clinic → error
 * 2. If DNI exists globally but NOT in this clinic → link to clinic
 * 3. If DNI doesn't exist → create patient + link to clinic
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { first_name, last_name, dni, phone, clinic_id } = body

  // Validate required fields
  if (!first_name || !last_name || !dni || !clinic_id) {
    return NextResponse.json(
      { error: "first_name, last_name, dni, and clinic_id are required" },
      { status: 400 }
    )
  }

  // Check permission: only admin and secretary can create patients
  const { data: roleData } = await supabase.rpc("get_user_role", {
    p_clinic_id: clinic_id,
  })

  if (!roleData || roleData === "doctor") {
    return NextResponse.json(
      { error: "Only admin and secretary can create patients" },
      { status: 403 }
    )
  }

  // Step 1: Check if patient with this DNI already exists
  const { data: existingPatient } = await supabase
    .from("patients")
    .select("id")
    .eq("dni", dni)
    .maybeSingle()

  if (existingPatient) {
    // Patient exists globally — check if already linked to this clinic
    const { data: existingLink } = await supabase
      .from("clinic_patients")
      .select("id")
      .eq("patient_id", existingPatient.id)
      .eq("clinic_id", clinic_id)
      .maybeSingle()

    if (existingLink) {
      return NextResponse.json(
        { error: "Patient already registered at this clinic", patient_id: existingPatient.id },
        { status: 409 }
      )
    }

    // Link existing patient to this clinic
    const { error: linkError } = await supabase
      .from("clinic_patients")
      .insert({ patient_id: existingPatient.id, clinic_id })

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }

    return NextResponse.json(
      { patient_id: existingPatient.id, linked: true, message: "Existing patient linked to clinic" },
      { status: 201 }
    )
  }

  // Step 2: Create new patient + link to clinic
  const { data: newPatient, error: createError } = await supabase
    .from("patients")
    .insert({ first_name, last_name, dni, phone: phone || null })
    .select("id")
    .single()

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  const { error: linkError } = await supabase
    .from("clinic_patients")
    .insert({ patient_id: newPatient.id, clinic_id })

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  return NextResponse.json(
    { patient_id: newPatient.id, linked: false, message: "Patient created and linked to clinic" },
    { status: 201 }
  )
}
```

- [ ] **Step 3: Verify the API route loads**

Run: `npm run dev`
Expected: No build errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/patients/route.ts
git commit -m "feat: add patient list and create API routes"
```

---

## Task 5: Patient API Routes — Get and Update Single Patient

**Files:**
- Create: `src/app/api/patients/[id]/route.ts`

- [ ] **Step 1: Create the directory**

Run: `mkdir -p "src/app/api/patients/[id]"`

- [ ] **Step 2: Write GET and PUT handlers**

Create `src/app/api/patients/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/patients/[id]?clinic_id=xxx
 *
 * Returns a single patient with their clinic-specific data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { searchParams } = request.nextUrl
  const clinicId = searchParams.get("clinic_id")

  if (!clinicId) {
    return NextResponse.json({ error: "clinic_id is required" }, { status: 400 })
  }

  // Fetch patient data
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single()

  if (patientError || !patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 })
  }

  // Fetch clinic-specific data
  const { data: clinicPatient, error: clinicError } = await supabase
    .from("clinic_patients")
    .select("*")
    .eq("patient_id", id)
    .eq("clinic_id", clinicId)
    .single()

  if (clinicError || !clinicPatient) {
    return NextResponse.json({ error: "Patient not linked to this clinic" }, { status: 404 })
  }

  return NextResponse.json({ patient, clinic_patient: clinicPatient })
}

/**
 * PUT /api/patients/[id]
 *
 * Body: { patient: {...}, clinic_patient: {...}, clinic_id: string }
 * Updates both the global patient record and the clinic-specific data.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  const body = await request.json()

  const { patient: patientData, clinic_patient: clinicPatientData, clinic_id } = body

  if (!clinic_id) {
    return NextResponse.json({ error: "clinic_id is required" }, { status: 400 })
  }

  // Check permission: only admin and secretary can edit patients
  const { data: roleData } = await supabase.rpc("get_user_role", {
    p_clinic_id: clinic_id,
  })

  if (!roleData || roleData === "doctor") {
    return NextResponse.json(
      { error: "Only admin and secretary can edit patients" },
      { status: 403 }
    )
  }

  // Update global patient data (exclude dni — it's read-only)
  if (patientData) {
    const { dni, id: _id, created_at, updated_at, ...safePatientData } = patientData
    const { error: patientError } = await supabase
      .from("patients")
      .update(safePatientData)
      .eq("id", id)

    if (patientError) {
      return NextResponse.json({ error: patientError.message }, { status: 500 })
    }
  }

  // Update clinic-specific data
  if (clinicPatientData) {
    const { id: _id, clinic_id: _cid, patient_id: _pid, created_at, updated_at, ...safeClinicData } = clinicPatientData
    const { error: clinicError } = await supabase
      .from("clinic_patients")
      .update(safeClinicData)
      .eq("patient_id", id)
      .eq("clinic_id", clinic_id)

    if (clinicError) {
      return NextResponse.json({ error: clinicError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Verify no build errors**

Run: `npm run dev`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/patients/[id]/route.ts"
git commit -m "feat: add get and update single patient API routes"
```

---

## Task 6: React Query Hooks

**Files:**
- Create: `src/lib/hooks/use-patients.ts`

- [ ] **Step 1: Create hooks directory and file**

Run: `mkdir -p src/lib/hooks`

- [ ] **Step 2: Write the hooks**

Create `src/lib/hooks/use-patients.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useClinic } from "@/providers/clinic-provider"

// ─── Types ────────────────────────────────────────────────────────────

type PatientRow = {
  id: string
  first_name: string
  last_name: string
  dni: string | null
  phone: string | null
  email: string | null
  whatsapp_phone: string | null
  date_of_birth: string | null
  gender: string | null
  blood_type: string | null
  allergies: string | null
}

type ClinicPatientRow = {
  id: string
  blacklist_status: string
  no_show_count: number
  insurance_provider: string | null
  insurance_plan: string | null
  insurance_member_number: string | null
  notes: string | null
  tags: string[] | null
  patient_type: string | null
  frequency: string | null
}

export type PatientListItem = {
  id: string
  blacklist_status: string
  no_show_count: number
  insurance_provider: string | null
  insurance_plan: string | null
  patients: PatientRow
}

type PatientsResponse = {
  patients: PatientListItem[]
  total: number
  page: number
  limit: number
}

type PatientDetailResponse = {
  patient: PatientRow
  clinic_patient: ClinicPatientRow
}

type CreatePatientInput = {
  first_name: string
  last_name: string
  dni: string
  phone?: string
}

// ─── Hooks ────────────────────────────────────────────────────────────

/**
 * Fetch paginated patient list for the active clinic.
 * Supports search by name or DNI.
 */
export function usePatients(search: string, page: number) {
  const { activeClinicId } = useClinic()

  return useQuery<PatientsResponse>({
    queryKey: ["patients", activeClinicId, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        clinic_id: activeClinicId!,
        search,
        page: String(page),
        limit: "20",
      })
      const res = await fetch(`/api/patients?${params}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch patients")
      }
      return res.json()
    },
    enabled: !!activeClinicId,
  })
}

/**
 * Fetch a single patient with clinic-specific data.
 */
export function usePatient(id: string) {
  const { activeClinicId } = useClinic()

  return useQuery<PatientDetailResponse>({
    queryKey: ["patient", id, activeClinicId],
    queryFn: async () => {
      const params = new URLSearchParams({ clinic_id: activeClinicId! })
      const res = await fetch(`/api/patients/${id}?${params}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to fetch patient")
      }
      return res.json()
    },
    enabled: !!activeClinicId && !!id,
  })
}

/**
 * Create a new patient (or link existing one to clinic).
 * Invalidates the patient list cache on success.
 */
export function useCreatePatient() {
  const queryClient = useQueryClient()
  const { activeClinicId } = useClinic()

  return useMutation({
    mutationFn: async (input: CreatePatientInput) => {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, clinic_id: activeClinicId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create patient")
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] })
    },
  })
}

/**
 * Update a patient's global and clinic-specific data.
 * Invalidates both the patient list and detail caches on success.
 */
export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient()
  const { activeClinicId } = useClinic()

  return useMutation({
    mutationFn: async (input: { patient?: Partial<PatientRow>; clinic_patient?: Partial<ClinicPatientRow> }) => {
      const res = await fetch(`/api/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, clinic_id: activeClinicId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update patient")
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] })
      queryClient.invalidateQueries({ queryKey: ["patient", id] })
    },
  })
}
```

- [ ] **Step 3: Verify no build errors**

Run: `npm run dev`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/hooks/use-patients.ts
git commit -m "feat: add React Query hooks for patient CRUD"
```

---

## Task 7: Patient List Page

**Files:**
- Create: `src/components/patients/patient-search.tsx`
- Create: `src/components/patients/patient-table.tsx`
- Create: `src/app/(dashboard)/patients/page.tsx`

**IMPORTANT:** Use `/frontend-design` skill for all component UI in this task.

- [ ] **Step 1: Create components directory**

Run: `mkdir -p src/components/patients`

- [ ] **Step 2: Create patient search component**

Create `src/components/patients/patient-search.tsx`:

```tsx
"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type PatientSearchProps = {
  value: string
  onChange: (value: string) => void
}

export function PatientSearch({ value, onChange }: PatientSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        placeholder="Search by name or DNI..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
```

- [ ] **Step 3: Create patient table component**

Create `src/components/patients/patient-table.tsx`:

```tsx
"use client"

import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle } from "lucide-react"
import type { PatientListItem } from "@/lib/hooks/use-patients"

type PatientTableProps = {
  patients: PatientListItem[]
}

export function PatientTable({ patients }: PatientTableProps) {
  const router = useRouter()

  if (patients.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        No patients found.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>DNI</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Insurance</TableHead>
          <TableHead className="w-8"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((cp) => (
          <TableRow
            key={cp.id}
            className="cursor-pointer"
            onClick={() => router.push(`/patients/${cp.patients.id}`)}
          >
            <TableCell className="font-medium">
              {cp.patients.last_name}, {cp.patients.first_name}
            </TableCell>
            <TableCell>{cp.patients.dni}</TableCell>
            <TableCell>{cp.patients.phone || "—"}</TableCell>
            <TableCell>{cp.insurance_provider || "—"}</TableCell>
            <TableCell>
              {cp.blacklist_status === "warned" && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              {cp.blacklist_status === "blacklisted" && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 4: Create patient list page**

Create `src/app/(dashboard)/patients/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePatients } from "@/lib/hooks/use-patients"
import { PatientSearch } from "@/components/patients/patient-search"
import { PatientTable } from "@/components/patients/patient-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useEffect } from "react"

export default function PatientsPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page on new search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading, error } = usePatients(debouncedSearch, page)

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Patients</h1>
        <Button onClick={() => router.push("/patients/new")} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          New Patient
        </Button>
      </div>

      {/* Search */}
      <PatientSearch value={search} onChange={setSearch} />

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
      ) : error ? (
        <div className="py-12 text-center text-sm text-red-500">
          Error loading patients.
        </div>
      ) : (
        <>
          <PatientTable patients={data?.patients || []} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data?.total || 0)} of {data?.total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify patient list page works**

Run: `npm run dev`, navigate to `/patients`.
Expected: Page loads, shows search bar, "New Patient" button, and table (empty or with seed data if you ran the seed script).

- [ ] **Step 6: Commit**

```bash
git add src/components/patients/patient-search.tsx src/components/patients/patient-table.tsx src/app/(dashboard)/patients/page.tsx
git commit -m "feat: add patient list page with search and table"
```

---

## Task 8: Create Patient Page

**Files:**
- Create: `src/components/patients/patient-form.tsx`
- Create: `src/app/(dashboard)/patients/new/page.tsx`

**IMPORTANT:** Use `/frontend-design` skill for form UI.

- [ ] **Step 1: Create patient form component (minimal version for create)**

Create `src/components/patients/patient-form.tsx`:

```tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

// ─── Create schema (minimal) ─────────────────────────────────────────

const createPatientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dni: z.string().min(1, "DNI is required"),
  phone: z.string().optional(),
})

export type CreatePatientFormData = z.infer<typeof createPatientSchema>

// ─── Component ────────────────────────────────────────────────────────

type PatientFormProps = {
  onSubmit: (data: CreatePatientFormData) => void
  isLoading: boolean
  error?: string | null
}

export function PatientForm({ onSubmit, isLoading, error }: PatientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientSchema),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="first_name">First Name *</Label>
          <Input id="first_name" {...register("first_name")} />
          {errors.first_name && (
            <p className="text-xs text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input id="last_name" {...register("last_name")} />
          {errors.last_name && (
            <p className="text-xs text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="dni">DNI *</Label>
          <Input id="dni" {...register("dni")} />
          {errors.dni && (
            <p className="text-xs text-red-600">{errors.dni.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Patient"}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create the new patient page**

Run: `mkdir -p "src/app/(dashboard)/patients/new"`

Create `src/app/(dashboard)/patients/new/page.tsx`:

```tsx
"use client"

import { useRouter } from "next/navigation"
import { useCreatePatient } from "@/lib/hooks/use-patients"
import { PatientForm, type CreatePatientFormData } from "@/components/patients/patient-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function NewPatientPage() {
  const router = useRouter()
  const createPatient = useCreatePatient()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(data: CreatePatientFormData) {
    setError(null)
    try {
      const result = await createPatient.mutateAsync(data)
      router.push(`/patients/${result.patient_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Patients
      </Link>

      <h1 className="text-xl font-semibold">New Patient</h1>

      <PatientForm
        onSubmit={handleSubmit}
        isLoading={createPatient.isPending}
        error={error}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verify create page works**

Run: `npm run dev`, navigate to `/patients/new`.
Expected: Form with 4 fields, validation on submit, saves to database on success.

- [ ] **Step 4: Commit**

```bash
git add src/components/patients/patient-form.tsx "src/app/(dashboard)/patients/new/page.tsx"
git commit -m "feat: add create patient page with minimal form"
```

---

## Task 9: Edit Patient Page

**Files:**
- Create: `src/app/(dashboard)/patients/[id]/page.tsx`

**IMPORTANT:** Use `/frontend-design` skill for the edit form UI.

- [ ] **Step 1: Create the edit page directory**

Run: `mkdir -p "src/app/(dashboard)/patients/[id]"`

- [ ] **Step 2: Create the edit patient page**

Create `src/app/(dashboard)/patients/[id]/page.tsx`:

```tsx
"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { usePatient, useUpdatePatient } from "@/lib/hooks/use-patients"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data, isLoading: isFetching } = usePatient(id)
  const updatePatient = useUpdatePatient(id)
  const [error, setError] = useState<string | null>(null)

  const patientForm = useForm()
  const clinicForm = useForm()

  // Populate forms when data loads
  useEffect(() => {
    if (data) {
      patientForm.reset({
        first_name: data.patient.first_name,
        last_name: data.patient.last_name,
        dni: data.patient.dni,
        date_of_birth: data.patient.date_of_birth || "",
        gender: data.patient.gender || "",
        phone: data.patient.phone || "",
        email: data.patient.email || "",
        whatsapp_phone: data.patient.whatsapp_phone || "",
        blood_type: data.patient.blood_type || "",
        allergies: data.patient.allergies || "",
      })
      clinicForm.reset({
        insurance_provider: data.clinic_patient.insurance_provider || "",
        insurance_plan: data.clinic_patient.insurance_plan || "",
        insurance_member_number: data.clinic_patient.insurance_member_number || "",
        notes: data.clinic_patient.notes || "",
      })
    }
  }, [data])

  async function handleSubmit() {
    setError(null)
    const patientData = patientForm.getValues()
    const clinicData = clinicForm.getValues()

    // Remove DNI from update (read-only)
    const { dni, ...patientUpdate } = patientData

    try {
      await updatePatient.mutateAsync({
        patient: patientUpdate,
        clinic_patient: clinicData,
      })
      router.push("/patients")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    }
  }

  if (isFetching) {
    return <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
  }

  if (!data) {
    return <div className="py-12 text-center text-sm text-red-500">Patient not found.</div>
  }

  return (
    <div className="space-y-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Patients
      </Link>

      <div>
        <h1 className="text-xl font-semibold">
          {data.patient.last_name}, {data.patient.first_name}
        </h1>
        <p className="text-sm text-gray-500">DNI: {data.patient.dni}</p>
      </div>

      {/* Patient Info Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Patient Info
        </h2>

        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          <div className="space-y-1">
            <Label>First Name</Label>
            <Input {...patientForm.register("first_name")} />
          </div>
          <div className="space-y-1">
            <Label>Last Name</Label>
            <Input {...patientForm.register("last_name")} />
          </div>
          <div className="space-y-1">
            <Label>DNI</Label>
            <Input value={data.patient.dni || ""} disabled className="bg-gray-50" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          <div className="space-y-1">
            <Label>Date of Birth</Label>
            <Input type="date" {...patientForm.register("date_of_birth")} />
          </div>
          <div className="space-y-1">
            <Label>Gender</Label>
            <Input {...patientForm.register("gender")} placeholder="male / female / other" />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input {...patientForm.register("phone")} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" {...patientForm.register("email")} />
          </div>
          <div className="space-y-1">
            <Label>WhatsApp</Label>
            <Input {...patientForm.register("whatsapp_phone")} />
          </div>
          <div className="space-y-1">
            <Label>Blood Type</Label>
            <Input {...patientForm.register("blood_type")} placeholder="A+, O-, ..." />
          </div>
        </div>

        <div className="max-w-2xl space-y-1">
          <Label>Allergies</Label>
          <Input {...patientForm.register("allergies")} placeholder="Penicillin, ..." />
        </div>
      </div>

      {/* Clinic Info Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Clinic Info
        </h2>

        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          <div className="space-y-1">
            <Label>Insurance Provider</Label>
            <Input {...clinicForm.register("insurance_provider")} placeholder="OSDE, Swiss Medical..." />
          </div>
          <div className="space-y-1">
            <Label>Insurance Plan</Label>
            <Input {...clinicForm.register("insurance_plan")} placeholder="OSDE 310..." />
          </div>
          <div className="space-y-1">
            <Label>Member Number</Label>
            <Input {...clinicForm.register("insurance_member_number")} />
          </div>
        </div>

        <div className="max-w-2xl space-y-1">
          <Label>Notes</Label>
          <Textarea {...clinicForm.register("notes")} placeholder="Secretary notes..." rows={3} />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={updatePatient.isPending}>
          {updatePatient.isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/patients")}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify edit page works**

Run: `npm run dev`
1. Navigate to `/patients` → click a patient row
2. Should see the edit form with two sections
3. DNI field should be disabled (read-only)
4. Edit a field, click Save → should redirect to `/patients`

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/patients/[id]/page.tsx"
git commit -m "feat: add edit patient page with full form"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Run the full app and test all flows**

Run: `npm run dev`

Test the following:
1. **Login page**: Blue button, flat card, no shadows
2. **Dashboard**: Blue sidebar, compact topbar, flat placeholder
3. **Sidebar navigation**: Click "Patients" → goes to `/patients`
4. **Patient list**: Search bar visible, "New Patient" button visible, table renders
5. **Search**: Type a name → table filters (debounced)
6. **Create patient**: Click "New Patient" → fill form → save → redirects to edit page
7. **Edit patient**: All fields visible, DNI disabled, two sections, save works
8. **Back navigation**: "Back to Patients" link works on both create and edit pages
9. **Pagination**: If more than 20 patients, pagination buttons appear

- [ ] **Step 2: Run build check**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during final verification"
```
