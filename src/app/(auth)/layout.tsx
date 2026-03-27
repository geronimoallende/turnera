/**
 * Auth layout: wraps the login page.
 *
 * This layout centers its content on the screen with a light gray background.
 * No sidebar, no topbar — just the login card in the middle.
 *
 * Only pages inside src/app/(auth)/ use this layout.
 * Pages inside src/app/(dashboard)/ use a different layout with sidebar.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {children}
    </div>
  )
}
