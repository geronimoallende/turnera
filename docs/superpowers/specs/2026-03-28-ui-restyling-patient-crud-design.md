# Spec A: UI Restyling + Patient CRUD

## Date: 2026-03-28

## Summary

Two-part spec: (1) Restyle existing UI to blue/white/Obsidian-flat design. (2) Build Patient CRUD pages (list, create, edit) with search-first approach.

---

## Part 1: UI Restyling

### Color Scheme

| Element | Color | Tailwind |
|---------|-------|----------|
| Sidebar background | `#1e40af` | `blue-800` |
| Sidebar active link | `#2563eb` | `blue-600` |
| Sidebar hover | `#1d4ed8` | `blue-700` |
| Sidebar text | `#ffffff` | `white` |
| Primary accent (buttons, links) | `#3b82f6` | `blue-500` |
| Content background | `#ffffff` | `white` |
| Card/section background | `#f9fafb` | `gray-50` |
| Primary text | `#1a1a1a` | custom |
| Secondary text | `#6b7280` | `gray-500` |
| Borders | `#e5e5e5` | custom |

Status colors remain unchanged:
- Green: confirmed
- Yellow: pending
- Red: cancelled/emergency
- Gray: no-show/completed

### Style Principles (Obsidian-inspired)

- **No box shadows** — flat everything
- **Thin 1px borders** — subtle, `#e5e5e5`
- **Compact spacing** — less padding than typical dashboards
- **Clean Inter font** — readable but not bulky
- **Flat buttons** — with subtle hover transitions
- **Minimal color usage** — blue only for primary actions and active states
- **No heavy rounded cards** — tighter, cleaner layout

### Components to Restyle

1. **Sidebar** (`src/components/layout/sidebar.tsx`)
   - Background: white → `blue-800`
   - Text: gray → white
   - Active link: gray-100 bg → `blue-600` bg
   - Hover: gray-50 → `blue-700`
   - Icons: gray → white
   - "Turnera" logo text: dark → white

2. **Topbar** (`src/components/layout/topbar.tsx`)
   - Keep white background
   - Thin bottom border
   - Make more compact (reduce height if needed)

3. **Login page** (`src/app/(auth)/login/page.tsx`)
   - Button: generic → `blue-500`
   - Card: remove any shadows, thin border only

4. **Dashboard page** (`src/app/(dashboard)/dashboard/page.tsx`)
   - Update placeholder card to match flat style

5. **shadcn/ui theme** — update the primary CSS variable in `globals.css` to blue-500 so all shadcn components (Button, Badge, etc.) use blue by default.

---

## Part 2: Patient CRUD

### Pages & Routes

| Page | Route | Purpose |
|------|-------|---------|
| Patient List | `/patients` | Search & browse patients |
| New Patient | `/patients/new` | Create a new patient |
| Edit Patient | `/patients/[id]` | View & edit patient details |

### File Structure

```
src/app/(dashboard)/patients/
  ├── page.tsx                    # Patient list (search + table)
  └── [id]/
      └── page.tsx                # Edit patient
  └── new/
      └── page.tsx                # Create patient

src/app/api/patients/
  ├── route.ts                    # GET (list/search) + POST (create)
  └── [id]/
      └── route.ts                # GET (single) + PUT (update)

src/components/patients/
  ├── patient-form.tsx            # Reusable form (used by create & edit)
  ├── patient-table.tsx           # Table component for the list
  └── patient-search.tsx          # Search input component

src/lib/hooks/
  └── use-patients.ts             # React Query hooks (usePatients, usePatient, useCreatePatient, useUpdatePatient)
```

### Patient List Page (`/patients`)

- **Search bar** at the top — filters by name or DNI as you type (debounced 300ms)
- **Table columns**: Name (last, first), DNI, Phone, Insurance, Status indicator
- **Pagination**: 20 patients per page
- **Sort**: by last name (default)
- **Blacklist indicator**: `⚠` icon for warned patients, red badge for blacklisted
- **Click row** → navigates to `/patients/[id]`
- **"+ New Patient" button** in the top right

### Create Patient Page (`/patients/new`)

- **Minimal form** — only 4 fields:
  - First name (required)
  - Last name (required)
  - DNI (required)
  - Phone (optional)
- **Validation** (zod):
  - First name, last name: non-empty strings
  - DNI: non-empty, numeric string
- **On submit**:
  1. Check if DNI exists in `patients` table
  2. If exists globally but not in this clinic → link to clinic (create `clinic_patients` record), show info message
  3. If exists in this clinic → show error "Patient already registered at this clinic"
  4. If doesn't exist → create `patients` record + `clinic_patients` record
- **Back link** → returns to `/patients`

### Edit Patient Page (`/patients/[id]`)

- **Full form** with all fields, divided in two sections:
  - **Patient Info** (global `patients` table): first name, last name, DNI (read-only), date of birth, gender, phone, email, WhatsApp, blood type, allergies
  - **Clinic Info** (per-clinic `clinic_patients` table): insurance provider, insurance plan, member number, notes, tags
- **DNI is read-only** — displayed but not editable
- **On submit**: updates both `patients` and `clinic_patients` records
- **Back link** → returns to `/patients`

### API Routes

#### `GET /api/patients?clinic_id=xxx&search=garcia&page=1&limit=20`
- Joins `patients` with `clinic_patients` for the given clinic
- Filters by search term (name or DNI, case-insensitive)
- Returns paginated results with total count
- Server-side Supabase client (reads cookie for auth)

#### `POST /api/patients`
- Body: `{ first_name, last_name, dni, phone?, clinic_id }`
- Upsert logic: check DNI, create or link
- Returns created/linked patient

#### `GET /api/patients/[id]?clinic_id=xxx`
- Returns patient + clinic_patients data joined
- 404 if patient doesn't exist or not linked to clinic

#### `PUT /api/patients/[id]`
- Body: `{ patient: {...}, clinic_patient: {...} }`
- Updates both tables
- Returns updated patient

### Data Flow

```
Patient List Page
  → usePatients(clinicId, search, page) hook
    → GET /api/patients?clinic_id=xxx&search=xxx
      → Supabase server client
        → patients JOIN clinic_patients WHERE clinic_id = xxx
          → returns paginated results

Create Patient
  → useCreatePatient() hook
    → POST /api/patients
      → checks DNI uniqueness
        → inserts patients + clinic_patients
          → invalidates patient list cache

Edit Patient
  → usePatient(id, clinicId) hook
    → GET /api/patients/[id]?clinic_id=xxx
  → useUpdatePatient() hook
    → PUT /api/patients/[id]
      → updates patients + clinic_patients
        → invalidates patient list cache
```

### Permissions

| Action | Admin | Secretary | Doctor |
|--------|-------|-----------|--------|
| View patient list | Yes | Yes | Read-only |
| Create patient | Yes | Yes | No |
| Edit patient | Yes | Yes | No |

Doctor can see the patient list and details but cannot create or edit. Enforced at API route level (check role via `get_user_role()`).

---

## Implementation Order

1. Restyle existing UI (sidebar, topbar, login, dashboard, shadcn theme)
2. Create API routes for patients
3. Create React Query hooks
4. Build patient list page (with search + table)
5. Build create patient page (minimal form)
6. Build edit patient page (full form)

---

## What This Spec Does NOT Include

- Doctor schedule configuration (Spec B)
- Available slots UI (Spec B)
- Appointment history tab on patient page (Week 3)
- Patient deletion (soft-delete via `is_active` flag — deferred)
