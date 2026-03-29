/**
 * PatientSearch — a search input with debouncing.
 *
 * "Debouncing" means: wait for the user to STOP typing before
 * actually searching. Without it, typing "garcia" would trigger
 * 6 API calls (g, ga, gar, garc, garci, garcia). With debouncing,
 * it waits 300ms after the last keystroke, then fires ONE call.
 *
 * How it works:
 * 1. User types in the input → updates local state immediately (fast UI)
 * 2. A useEffect with setTimeout waits 300ms
 * 3. If the user types again within 300ms, the timer resets
 * 4. After 300ms of silence, calls onSearch(value) → parent fetches data
 */

"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type PatientSearchProps = {
  /** Called after the user stops typing (debounced) */
  onSearch: (value: string) => void
  /** Initial search value (e.g., from URL params) */
  initialValue?: string
}

export function PatientSearch({
  onSearch,
  initialValue = "",
}: PatientSearchProps) {
  // Local state for the input value (updates instantly as user types)
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    // Set a timer to call onSearch after 300ms
    const timer = setTimeout(() => {
      onSearch(value)
    }, 300)

    // Cleanup: if the user types again before 300ms, cancel the old timer
    // This is the "debounce" — only the LAST timer fires
    return () => clearTimeout(timer)
  }, [value, onSearch])

  return (
    <div className="relative">
      {/* Search icon inside the input */}
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        placeholder="Search by name or DNI..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border-[#e5e5e5] pl-9 shadow-none focus-visible:ring-blue-500"
      />
    </div>
  )
}
