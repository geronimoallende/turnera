/**
 * Home page — redirects to /dashboard.
 *
 * We don't need a public landing page. When someone visits "/",
 * they should go straight to the dashboard. If they're not logged in,
 * the middleware will catch them and redirect to /login instead.
 *
 * redirect() is a Next.js function that sends a 307 redirect
 * (temporary redirect) — the browser never renders this page,
 * it just bounces to /dashboard immediately.
 */

import { redirect } from "next/navigation"

export default function Home() {
  redirect("/dashboard")
}
