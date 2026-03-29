# Design System

## Philosophy

Sober, blue/white, Obsidian-inspired flat design. No shadows, thin borders, compact spacing. Each clinic can later customize colors/branding. A neutral base is easier to theme than undoing an opinionated design.

## Style Principles

- **No box shadows** — flat everything
- **Thin 1px borders** — subtle, `#e5e5e5`
- **Compact spacing** — less padding than typical dashboards
- **Clean Inter font** — readable but not bulky
- **Flat buttons** — with subtle hover transitions
- **Minimal color usage** — blue only for primary actions and active states
- **No heavy rounded cards** — tighter, cleaner layout (`rounded-md`)

## Colors

### Base Palette
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `background` | `#FFFFFF` | `white` | Page background, content area |
| `card` | `#F9FAFB` | `gray-50` | Card/section backgrounds |
| `card-hover` | `#F3F4F6` | `gray-100` | Table row hover, card hover |
| `border` | `#e5e5e5` | custom | All borders, dividers, input borders |
| `text-primary` | `#1a1a1a` | custom | Headings, primary text, labels |
| `text-secondary` | `#6B7280` | `gray-500` | Secondary text, descriptions |
| `text-muted` | `#9CA3AF` | `gray-400` | Placeholder text, disabled |

### Accent (Blue)
| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `primary` | `#3b82f6` | `blue-500` | Primary buttons, links, focus rings |
| `primary-hover` | `#2563eb` | `blue-600` | Button hover |
| `sidebar-bg` | `#1e40af` | `blue-800` | Sidebar background |
| `sidebar-active` | `#2563eb` | `blue-600` | Sidebar active link |
| `sidebar-hover` | `#1d4ed8` | `blue-700` | Sidebar hover |
| `sidebar-text` | `#ffffff` | `white` | Sidebar text and icons |
| `branding` | `#1e40af` | `blue-800` | App title ("Turnera") on login |

### Status Colors
| Status | Color | Hex | Background | Usage |
|--------|-------|-----|------------|-------|
| Confirmed | Green | `#16A34A` (green-600) | — | Confirmed appointments |
| Pending | Yellow | `#CA8A04` (yellow-600) | — | Awaiting confirmation |
| Cancelled | Red | `#DC2626` (red-600) | — | Cancelled, emergency |
| No-show | Gray | `#6B7280` (gray-500) | — | No-show, completed |
| Blacklisted | Red | `#DC2626` (red-600) | `#FEF2F2` (red-50) | Patient blacklist badge |
| Warned | Yellow | `#CA8A04` (yellow-600) | `#FEFCE8` (yellow-50) | Patient warning badge |

## Typography

- **Font**: Inter (loaded via `next/font/google`, set as `--font-sans`)
- **Mono font**: JetBrains Mono (for code, set as `--font-geist-mono`)
- **Headings**: font-semibold, `text-[#1a1a1a]`
  - h1: 24px (text-2xl)
  - h2: 20px (text-lg) + font-semibold
  - h3: 16px (text-base)
- **Body**: 14px (text-sm), font-normal
- **Small**: 12px (text-xs), `text-gray-500`
- **Labels**: 14px (text-sm), `text-[#1a1a1a]`

## Spacing

- Compact but not cramped
- Card/section padding: 24px (p-6)
- Form field gaps: 16px (space-y-4)
- Form label-to-input gap: 6px (space-y-1.5)
- Section gaps: 16px (space-y-4)
- Page padding: 24px (p-6) — set by dashboard layout
- Sidebar width: 256px (w-64)

## Components (shadcn/ui)

Using shadcn/ui (Radix + Tailwind). All components follow the flat/blue theme:

- **Buttons**:
  - Primary: `bg-blue-500 text-white shadow-none hover:bg-blue-600`
  - Outline: `border-[#e5e5e5] shadow-none`
  - Ghost: no border, subtle hover
  - Destructive: red for cancel/delete
- **Cards**: White background, `border border-[#e5e5e5] shadow-none rounded-md`
- **Inputs**: `border-[#e5e5e5] shadow-none focus-visible:ring-blue-500`
- **Tables**: `border border-[#e5e5e5]`, `bg-gray-50` header, `hover:bg-gray-50` rows, no shadows
- **Badges**: Small, flat. Status colors above. `shadow-none`
- **Dialogs**: Centered modal with overlay. Minimal padding.
- **Sidebar**: `bg-blue-800`, white text, `blue-600` active, `blue-700` hover, lucide icons

## Forms

- Use `react-hook-form` + `zod` for all forms
- Labels above inputs, `text-sm text-[#1a1a1a]`
- Required fields marked with `*`
- Validation errors: `text-xs text-red-600` below the field
- API errors: `text-sm text-red-600` above the submit button
- Submit buttons: blue-500, full-width on small forms, left-aligned on large forms

## Pages

- **List pages**: Title + action button (top), search bar, table, pagination
- **Create pages**: Back link, title, card with form (max-w-lg)
- **Edit pages**: Back link, title + status badge, card with form (max-w-2xl)
- **Auth pages**: Centered card on white background, blue-800 title

## Responsive Breakpoints

- Mobile: < 768px (sidebar collapses to hamburger menu)
- Tablet: 768px - 1024px (sidebar collapsed by default)
- Desktop: > 1024px (sidebar always visible)
