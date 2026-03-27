"use client"

/**
 * QueryProvider: wraps the entire app so React Query works everywhere.
 *
 * "use client" at the top means this component runs in the BROWSER.
 * React Query needs browser features (state, effects) so it can't run on the server.
 *
 * QueryClient is the "manager" — it stores cached data, tracks loading states,
 * and decides when to refetch. We create ONE instance and share it with the whole app.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState ensures we create the QueryClient only ONCE, not on every render.
  // If we created it outside the component, it would be shared between users
  // on the server (a security issue in Next.js).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't refetch when the user switches browser tabs
            // (we'll use Supabase Realtime for live updates instead)
            refetchOnWindowFocus: false,
            // If a request fails, retry once before showing an error
            retry: 1,
            // Cache data for 5 minutes before considering it "stale"
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  )

  // QueryClientProvider makes the queryClient available to every useQuery() hook
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
