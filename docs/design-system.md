# Design System

## Philosophy

Simple, white, easily modifiable. Each clinic can later customize colors/branding. A neutral base is easier to theme than undoing an opinionated design.

## Colors

### Base Palette
| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#FFFFFF` | Page background |
| `card` | `#F9FAFB` (gray-50) | Card backgrounds |
| `card-hover` | `#F3F4F6` (gray-100) | Card hover state |
| `border` | `#E5E7EB` (gray-200) | Borders, dividers |
| `text-primary` | `#111827` (gray-900) | Headings, primary text |
| `text-secondary` | `#6B7280` (gray-500) | Secondary text, labels |
| `text-muted` | `#9CA3AF` (gray-400) | Placeholder text |

### Accent
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#2563EB` (blue-600) | Primary buttons, links, active states |
| `primary-hover` | `#1D4ED8` (blue-700) | Button hover |
| `primary-light` | `#EFF6FF` (blue-50) | Selected/active backgrounds |

### Status Colors
| Status | Color | Hex | Usage |
|--------|-------|-----|-------|
| Confirmed | Green | `#16A34A` (green-600) | Confirmed appointments |
| Pending | Yellow | `#CA8A04` (yellow-600) | Awaiting confirmation |
| Cancelled | Red | `#DC2626` (red-600) | Cancelled, emergency |
| No-show | Gray | `#6B7280` (gray-500) | No-show, completed |
| Blacklisted | Red | `#DC2626` bg `#FEF2F2` | Patient blacklist badge |
| Warned | Yellow | `#CA8A04` bg `#FFFBEB` | Patient warning badge |

## Typography

- **Font**: Inter (or system font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`)
- **Headings**: font-semibold
  - h1: 24px (1.5rem)
  - h2: 20px (1.25rem)
  - h3: 16px (1rem)
- **Body**: 14px (0.875rem), font-normal
- **Small**: 12px (0.75rem), text-secondary

## Spacing

- Generous whitespace, not cramped
- Card padding: 16px (p-4)
- Section gaps: 24px (gap-6)
- Page padding: 24px (p-6)
- Sidebar width: 240px (w-60)

## Components (shadcn/ui)

Using shadcn/ui (Radix + Tailwind). All components follow the white/minimal theme:

- **Buttons**: Default variant is outline. Primary actions use `default` (blue). Destructive for cancel/delete.
- **Cards**: White background with subtle border. No shadows by default.
- **Tables**: Clean, minimal borders. Hover state on rows.
- **Badges**: Small, pill-shaped. Status colors above.
- **Dialogs**: Centered modal with overlay. Minimal padding.
- **Sidebar**: White background, gray-100 active item, no icons initially (text-only).

## Responsive Breakpoints

- Mobile: < 768px (sidebar collapses to hamburger menu)
- Tablet: 768px - 1024px (sidebar collapsed by default)
- Desktop: > 1024px (sidebar always visible)
