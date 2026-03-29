"use client"

/**
 * Sidebar — the left navigation menu.
 *
 * "use client" because it uses:
 * - usePathname() — to know which page is active (highlight the link)
 * - useAuth() — to know the user's role (some links are hidden for some roles)
 * - useClinic() — to know the active role at the current clinic
 *
 * What is a sidebar?
 * It's the vertical menu on the left side of dashboard apps.
 * Each item is a link to a different page. The active page is highlighted.
 *
 * On mobile, this becomes a "Sheet" (a panel that slides in from the left)
 * because phones are too narrow for a permanent sidebar.
 */

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

/**
 * Navigation items configuration.
 * Each item has:
 * - label: text shown in the sidebar
 * - href: the URL path it links to
 * - icon: the icon component from lucide-react
 * - roles: which roles can see this link (undefined = everyone can see it)
 */
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
    roles: ["admin"] as const, // Only admins can see Settings
  },
]

export function Sidebar() {
  // usePathname() returns the current URL path, e.g., "/dashboard" or "/patients"
  const pathname = usePathname()
  const { activeRole } = useClinic()

  return (
    <aside className="flex h-full w-64 flex-col bg-blue-800">
      {/* Logo / App name at the top */}
      <div className="flex h-12 items-center border-b border-blue-700 px-4">
        <Link href="/dashboard" className="text-xl font-semibold text-white">
          Turnera
        </Link>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems
          // Filter out items the user's role can't see
          .filter((item) => {
            if (!item.roles) return true // No role restriction = everyone
            return activeRole ? item.roles.includes(activeRole as "admin") : false
          })
          .map((item) => {
            // Check if this link is the active page
            // pathname.startsWith(item.href) handles sub-pages too
            // e.g., /patients/123 still highlights the "Patients" link
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  // Base styles for all links
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  // Active link = lighter blue background, white text
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                )}
              >
                {/* The icon — each lucide icon is a React component */}
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
      </nav>
    </aside>
  )
}
