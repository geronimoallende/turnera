/**
 * PatientSearch — Autocomplete search for finding patients during booking.
 *
 * The secretary types a DNI or name → results appear in a dropdown → click to select.
 * If no patient is found → "+ New patient" option at the bottom.
 *
 * How the search works:
 *   1. Secretary types "324" in the input
 *   2. We wait 300ms (debounce) to avoid searching on every keystroke
 *   3. Call GET /api/patients?clinic_id=xxx&search=324
 *   4. Show results in a dropdown
 *   5. Secretary clicks a result → onSelect(patient) is called
 *   6. Parent component (BookingForm) receives the selected patient
 *
 * "Debounce" means: wait until the user stops typing for 300ms before
 * making the API call. Without it, typing "32456" would make 5 separate
 * API calls: "3", "32", "324", "3245", "32456". With debounce, it only
 * makes 1 call with "32456".
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { usePatients, type PatientListItem } from "@/lib/hooks/use-patients"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PatientSearchProps = {
  clinicId: string
  // Called when the user selects a patient from the dropdown
  onSelect: (patient: PatientListItem) => void
  // Called when the user clicks "+ New patient"
  onNewPatient: () => void
}

export function PatientSearch({
  clinicId,
  onSelect,
  onNewPatient,
}: PatientSearchProps) {
  // What the user is typing in the search box
  const [inputValue, setInputValue] = useState("")
  // The debounced value — updated 300ms after the user stops typing
  const [debouncedSearch, setDebouncedSearch] = useState("")
  // Is the dropdown visible?
  const [isOpen, setIsOpen] = useState(false)
  // Reference to the container div (to detect clicks outside)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Debounce logic ──────────────────────────────────────────
  // When inputValue changes, start a 300ms timer.
  // If inputValue changes again before the timer fires, cancel and restart.
  // Only when the user stops typing for 300ms does the search actually run.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue)
    }, 300)
    // Cleanup: cancel the timer if inputValue changes before 300ms
    return () => clearTimeout(timer)
  }, [inputValue])

  // ── Fetch patients matching the search ──────────────────────
  // This only runs when debouncedSearch has at least 2 characters.
  // The usePatients hook calls GET /api/patients?search=...
  const { data } = usePatients(
    debouncedSearch.length >= 2 ? clinicId : null,
    debouncedSearch,
    1,   // page
    8    // limit — show max 8 results in dropdown
  )
  const patients = data?.data ?? []

  // ── Close dropdown when clicking outside ────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // If the click is outside our container, close the dropdown
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ── Handle selecting a patient ──────────────────────────────
  function handleSelect(patient: PatientListItem) {
    onSelect(patient)
    setInputValue("") // Clear the search
    setIsOpen(false)  // Close the dropdown
  }

  return (
    <div ref={containerRef} className="relative">
      <Label className="text-xs font-medium text-gray-600">Patient</Label>
      <Input
        type="text"
        placeholder="Search by DNI or name..."
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          if (inputValue.length >= 2) setIsOpen(true)
        }}
        className="mt-1 border-[#e5e5e5] shadow-none focus-visible:ring-blue-500"
      />

      {/* Dropdown — only visible when searching and there's something to show */}
      {isOpen && debouncedSearch.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[280px] overflow-y-auto rounded-lg border border-[#e5e5e5] bg-white shadow-lg">
          {/* Patient results */}
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={() => handleSelect(patient)}
              className="flex w-full items-center justify-between border-b border-[#f1f5f9] px-3 py-2.5 text-left hover:bg-gray-50"
            >
              <div>
                <div className="text-sm font-semibold">
                  {patient.last_name}, {patient.first_name}
                </div>
                <div className="text-[11px] text-gray-400">
                  DNI {patient.dni ?? "—"}
                  {patient.insurance_provider &&
                    ` · ${patient.insurance_provider}`}
                  {patient.insurance_plan && ` ${patient.insurance_plan}`}
                </div>
              </div>
              <span className="text-[11px] text-gray-400">
                No-shows: {patient.no_show_count ?? 0}
              </span>
            </button>
          ))}

          {/* "No results" message */}
          {patients.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">
              No patients found for &quot;{debouncedSearch}&quot;
            </div>
          )}

          {/* "+ New patient" option — always at the bottom */}
          <button
            onClick={() => {
              onNewPatient()
              setIsOpen(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-blue-500 hover:bg-blue-50"
          >
            <span className="text-lg">+</span>
            New patient
          </button>
        </div>
      )}
    </div>
  )
}
